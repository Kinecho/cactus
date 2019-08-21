import {Message} from "firebase-functions/lib/providers/pubsub";
import * as functions from "firebase-functions";
import {PubSub} from "@google-cloud/pubsub";
import {PubSubTopic} from "@shared/types/PubSubTypes";
import {getConfig} from "@api/config/configService";
import AdminSlackService, {
    AttachmentColor,
    SlackAttachmentField,
    SlackResponseType,
    SlashCommandResponse
} from "@admin/services/AdminSlackService";
import {getActiveUserCountForTrailingDays} from "@api/analytics/BigQueryUtil";
import {formatDateTime, getDateAtMidnightDenver, getISODate, mailchimpTimeZone} from "@shared/util/DateUtil";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import * as prettyMilliseconds from "pretty-ms";
import {ListMemberStatus} from "@shared/mailchimp/models/MailchimpTypes";
import CactusMember from "@shared/models/CactusMember";

const config = getConfig();

export enum JobType {
    today = "today",
    bigquery = "bigquery",
    durumuru = "durumuru",
    activeUsers = "activeUsers",
}

export interface JobRequest {
    type: JobType,
    payload?: any,
    slackResponseURL: string,
}

export async function onPublish(message: Message, context: functions.EventContext) {
    try {
        const job = message.json as JobRequest;
        await processJob(job);
    } catch (error) {
        console.error("Failed to process SlackCommand job", error);
    }
}


export async function processJob(job: JobRequest) {
    const start = new Date();
    let task: Promise<SlashCommandResponse> | undefined = undefined;
    switch (job.type) {
        case JobType.today:
            task = processToday(job);
            break;
        case JobType.bigquery:
            task = processBigQuery(job);
            break;
        case JobType.durumuru:
            task = processDurumuru(job);
            break;
        case JobType.activeUsers:
            task = processActiveUsers(job);
            break;

    }
    if (task) {
        const message = await task;
        const end = new Date();

        const duration = end.getTime() - start.getTime();
        const slackTimestamp = `${end.getTime() / 1000}`;
        const attachments = message.attachments || [];

        let lastAttachment = attachments.pop();
        if (!lastAttachment) {
            lastAttachment = {text: "Task Stats"};

        }

        lastAttachment = {
            text: "Task completed",
            ts: slackTimestamp,
            footer: `\`${job.type}\` took ${prettyMilliseconds(duration)}`,
            ...lastAttachment,
        };
        attachments.push(lastAttachment);
        message.attachments = attachments;
        if (!message.response_type) {
            console.log("defaulting the response type to ephemeral");
            message.response_type = SlackResponseType.ephemeral;
        }

        await AdminSlackService.getSharedInstance().sendToResponseUrl(job.slackResponseURL, message);


        console.log(`Finished processing SlackCommand ${job.type}`);
    } else {
        console.warn("No task was created for job", JSON.stringify(job, null, 2));
    }
}

async function processToday(job: JobRequest): Promise<SlashCommandResponse> {
    console.log("Getting today's stuff");
    const todayDate = getDateAtMidnightDenver(new Date());
    console.log(`Date for today: ${formatDateTime(todayDate)}`);

    const [todayFields, allTimeFields] = await Promise.all([
        getTodayStatFields(todayDate),
        getAllTimeStatFields()]);

    const attachments = [{
        title: `Today's Stats`,
        text: `Events since ${formatDateTime(todayDate, {timezone: mailchimpTimeZone})}`,
        fields: todayFields,
        color: AttachmentColor.info,
    }, {
        title: "All-Time Stats",
        text: "Summary of metrics since the launch of Cactus",
        fields: allTimeFields,
        color: "good",
    }];
    return {
        text: `:bar_chart: Here are some key metrics. Unless noted with a datastudio icon, all stats are "real-time"`,
        attachments,
        response_type: SlackResponseType.in_channel
    };

}


async function getTodayStatFields(todayDate: Date): Promise<SlackAttachmentField[]> {

    const todayFields: SlackAttachmentField[] = [];
    const tasks = [
        AdminCactusMemberService.getSharedInstance().getMembersCreatedSince(todayDate),
        AdminCactusMemberService.getSharedInstance().getMembersUnsubscribedSince(todayDate),
    ];
    console.log("signups tasks prepared...awaiting");
    const [allMembers, unsubscriberes] = await Promise.all(tasks);
    console.log("signups came back");
    console.log(`Got ${allMembers.length} members created up since ${getISODate(todayDate)}`);

    const confirmedMemberCount = allMembers.reduce((count, member) => {
        if (!member.signupConfirmedAt) {
            return count;
        } else {
            return count + 1;
        }
    }, 0);

    const topReferrers: { [email: string]: number } = allMembers.reduce((map: { [email: string]: number }, member) => {
        const referrer = member.referredByEmail;
        if (!referrer) {
            return map;
        }
        map[referrer] = (map[referrer] || 0) + 1;

        return map;
    }, {});

    todayFields.push({
            title: `New Sign Ups`,
            value: `${allMembers.length}`,
            short: false,
        }, {
            title: `Confirmed Sign Ups`,
            value: `${confirmedMemberCount}`,
            short: false,
        }, {
            title: `Unsubscribers`,
            value: `${unsubscriberes.length}`,
            short: false,
        }, {
            title: "Referrers",
            value: `${Object.entries(topReferrers).sort(([, v1], [, v2]) => v2 - v1).map(([email, count]) => {
                return `${email}: ${count}`
            }).join("\n") || "None"}`
        }
    );
    return todayFields;
}


async function getAllTimeStatFields(): Promise<SlackAttachmentField[]> {

    const [durumuru, allMembers] = await Promise.all([
        getDurumuru(),
        AdminCactusMemberService.getSharedInstance().getAllMembers()
    ]);

    const confirmedStatuses = [ListMemberStatus.subscribed, ListMemberStatus.unsubscribed];

    interface ReferrerMap {
        [email: string]: number
    }

    interface Stats {
        confirmed: number,
        unsubscribed: number,
        referrals: number,
        referrers: ReferrerMap
    }

    function isConfirmed(member: CactusMember): boolean {
        return Boolean(member.signupConfirmedAt || (member.mailchimpListMember && confirmedStatuses.includes(member.mailchimpListMember.status)));
    }

    function isUnsubscribed(member: CactusMember): boolean {
        return !!member.unsubscribedAt
    }

    const memberStats: Stats = allMembers.reduce((stats: Stats, member) => {
        stats.confirmed = isConfirmed(member) ? stats.confirmed + 1 : stats.confirmed;
        stats.unsubscribed = isUnsubscribed(member) ? stats.unsubscribed + 1 : stats.unsubscribed;


        if (member.referredByEmail) {
            stats.referrals = stats.referrals + 1;
            stats.referrers[member.referredByEmail] = (stats.referrers[member.referredByEmail] || 0) + 1;
        }

        return stats;
    }, {confirmed: 0, unsubscribed: 0, referrals: 0, referrers: {}});

    const uniqueReferrers = Object.keys(memberStats.referrers).length;
    const topReferrersString = Object.entries(memberStats.referrers).sort(([, v1], [, v2]) => v2 - v1).slice(0, 20).map(([email, count]) => {
        return `${email}: ${count}`
    }).join("\n") || "None";

    return [
        {
            title: "Sign Ups ",
            value: `${memberStats.confirmed}`,
            short: true,

        },
        {
            title: "Unsubscribes ",
            value: `${memberStats.unsubscribed}`,
            short: true,
        },
        {
            title: "Referral Sign Ups",
            value: `${(100 * memberStats.referrals / memberStats.confirmed).toFixed(2)}% (${memberStats.referrals}/${memberStats.confirmed})`,
            short: true,

        },
        {
            title: "Unique Referrers ",
            value: `${(100 * uniqueReferrers / memberStats.confirmed).toFixed(2)}% (${uniqueReferrers}/${memberStats.confirmed})`,
            short: true,
        },
        {
            title: ":datastudio: DURU/MURU ",
            value: `${(durumuru.durumuru * 100).toFixed(2)}% (${durumuru.today}/${durumuru.l30})`,
            short: true,
        },
        {
            title: "Top 20 Referrers",
            value: topReferrersString,
            short: false,
        }
    ]
}

async function processBigQuery(job: JobRequest): Promise<SlashCommandResponse> {
    const pubsub = new PubSub();
    await pubsub.topic(PubSubTopic.firestore_export_bigquery).publishJSON({});


    return {
        text: `BigQuery export job started for project ${config.web.domain}. This process typically takes about 5 minutes before results show up in <Data Studio|https://datastudio.google.com/u/0/reporting/13ZD824pAbhdTWyybDzITow4V0vFgIEqC/page/aZQu>`,
        response_type: SlackResponseType.ephemeral
    };
}

async function getDurumuru(): Promise<{ l30: number, today: number, durumuru: number }> {
    console.log("fetching duru/muru");
    const activeUsersToday = await getActiveUserCountForTrailingDays(1);
    const activeUsersL30 = await getActiveUserCountForTrailingDays(30);

    return {l30: activeUsersL30, today: activeUsersToday, durumuru: activeUsersToday / activeUsersL30}
}

async function processDurumuru(job: JobRequest): Promise<SlashCommandResponse> {
    let days = 1;
    if (job.payload.length > 0) {
        const [dayArg] = job.payload;
        days = Number(dayArg);
    }

    console.log("getting active users for last ", days);
    const durumuruSummary = await getDurumuru();
    return {
        response_type: SlackResponseType.in_channel,
        attachments: [
            {
                title: `${(durumuruSummary.durumuru).toFixed(3)} (${durumuruSummary.today}/${durumuruSummary.l30}) is today's DURU/MURU :sunny: /:spiral_calendar_pad: `,
                text: `That is, ${durumuruSummary.today} unique users have reflected in the last 24 hours, and ${durumuruSummary.l30} unique users have reflected in the last 30 days.`
            }
        ]

    }
}

async function processActiveUsers(job: JobRequest): Promise<SlashCommandResponse> {
    let days = 1;
    if (job.payload.length > 0) {
        const [dayArg] = job.payload;
        days = Number(dayArg);
    }

    console.log("getting active users for last ", days);
    const activeUsers = await getActiveUserCountForTrailingDays(days);

    return {
        text: `There have been *${activeUsers}* unique users with a reflection response over the last *${days}* days`,
        response_type: SlackResponseType.ephemeral
    }
}

export function getSlackHelpText(): { intro: string, commands: string } {
    const commandDescriptions: string[] = [];
    const commands = getCommandDescriptions();
    Object.keys(commands).forEach(name => {
        commandDescriptions.push(`\`${name}\` - ${commands[name]}\n`);
    });

    const intro = `The \`/cactus\` slash command can be used to interact with Cactus data in different ways. The command format is ` +
        `\`/cactus [command] [parameters]\` ` +
        `where multiple \`parameters\` are space separated values.`;

    const commandText = `\n\n*Available Commands*:\n${commandDescriptions.join("\n").trim()}`;

    return {intro, commands: commandText};
}

export function getCommandDescriptions(): { [name: string]: string } {
    const map: { [name: string]: string } = {};
    Object.keys(JobType).forEach((name) => {
        map[name] = getJobTypeDescription(name as JobType);
    });
    return map;
}

export function getJobTypeDescription(jobType: JobType): string {
    switch (jobType) {
        case JobType.today:
            return `Get a summary of today's activity. Data is real-time, not pulled from BigQuery.`;
        case JobType.bigquery:
            return `Start the data export process to BigQuery. This will update the DataStudio dashboard. Updates typically take about 5 minutes to show up.`;
        case JobType.durumuru:
            return `Get the Daily Unique Reflecting Users / Monthly Unique Reflecting Users metric. `;
        case JobType.activeUsers:
            return `\`numDays\` (defaults to \`1\`) - Get the total number of unique users reflecting in the last \`numDays\``;
        default:
            return `(no description found)`;
    }
}