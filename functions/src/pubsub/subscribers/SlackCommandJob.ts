import {Message} from "firebase-functions/lib/providers/pubsub";
import * as functions from "firebase-functions";
import {PubSub} from "@google-cloud/pubsub";
import {PubSubTopic} from "@shared/types/PubSubTypes";
import {getConfig} from "@api/config/configService";
import AdminSlackService, {
    SlackAttachmentField,
    SlackResponseType,
    SlashCommandResponse
} from "@admin/services/AdminSlackService";
import {getActiveUserCountForTrailingDays} from "@api/analytics/BigQueryUtil";
import {formatDateTime, getDateAtMidnightDenver, getISODate} from "@shared/util/DateUtil";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import * as prettyMilliseconds from "pretty-ms";

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

    const fields: SlackAttachmentField[] = [];
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

    fields.push({
            title: `All New Members`,
            value: `${allMembers.length}`,
            short: true,
        }, {
            title: `Confirmed Members`,
            value: `${confirmedMemberCount}`,
            short: true,
        }, {
            title: `Unsubscribes`,
            value: `${unsubscriberes.length}`,
            short: true,
        }, {
            title: "Top Referrers",
            value: `${Object.entries(topReferrers).sort(([, v1], [, v2]) => v2 - v1).map(([email, count]) => {
                return `${email}: ${count}`
            }).join("\n") || "None"}`
        }
    );

    const attachments = [{
        text: "These stats are pulled real-time from the database, not big query.",
        fields,
    }];
    return {
        text: `:bar_chart: Here are some key metrics since *${formatDateTime(todayDate)}*.`,
        attachments,
        response_type: SlackResponseType.in_channel
    };

}

async function processBigQuery(job: JobRequest): Promise<SlashCommandResponse> {
    const pubsub = new PubSub();
    await pubsub.topic(PubSubTopic.firestore_export_bigquery).publishJSON({});


    return {
        text: `BigQuery export job started for project ${config.web.domain}. This process typically takes about 5 minutes before results show up in <Data Studio|https://datastudio.google.com/u/0/reporting/13ZD824pAbhdTWyybDzITow4V0vFgIEqC/page/aZQu>`,
        response_type: SlackResponseType.ephemeral
    };
}

async function processDurumuru(job: JobRequest): Promise<SlashCommandResponse> {
    let days = 1;
    if (job.payload.length > 0) {
        const [dayArg] = job.payload;
        days = Number(dayArg);
    }

    console.log("getting active users for last ", days);
    const activeUsersToday = await getActiveUserCountForTrailingDays(1);
    const activeUsersL30 = await getActiveUserCountForTrailingDays(30);

    return {
        response_type: SlackResponseType.in_channel,
        attachments: [
            {
                title: `${(activeUsersToday / activeUsersL30).toFixed(3)} (${activeUsersToday}/${activeUsersL30}) is today's DURU/MURU :sunny: /:spiral_calendar_pad: `,
                text: `That is, ${activeUsersToday} unique users have reflected in the last 24 hours, and ${activeUsersL30} unique users have reflected in the last 30 days.`
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