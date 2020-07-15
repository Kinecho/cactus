import { Message } from "firebase-functions/lib/providers/pubsub";
import * as functions from "firebase-functions";
import { PubSub } from "@google-cloud/pubsub";
import { PubSubTopic } from "@shared/types/PubSubTypes";
import { getConfig } from "@admin/config/configService";
import AdminSlackService, {
    AttachmentColor,
    ChatMessage,
    SlackAttachment,
    SlackAttachmentField,
    SlackResponseType,
    SlashCommandResponse
} from "@admin/services/AdminSlackService";
import { getActiveUserCountForTrailingDays } from "@api/analytics/BigQueryUtil";
import {
    AmericaDenverTimezone,
    formatDateTime,
    getDateAtMidnightDenver,
    getISODate,
    millisecondsToMinutes
} from "@shared/util/DateUtil";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import * as prettyMilliseconds from "pretty-ms";
import { ListMemberStatus } from "@shared/mailchimp/models/MailchimpTypes";
import CactusMember from "@shared/models/CactusMember";
import AdminReflectionResponseService from "@admin/services/AdminReflectionResponseService";
import ReflectionResponse, { getResponseMediumDisplayName } from "@shared/models/ReflectionResponse";
import Logger from "@shared/Logger";
import { stringifyJSON } from "@shared/util/ObjectUtil";
import { formatPriceCentsUsd, isValidEmail } from "@shared/util/StringUtil";
import { CactusElement } from "@shared/models/CactusElement";
import DeletedUser from "@shared/models/DeletedUser";
import AdminDeletedUserService from "@admin/services/AdminDeletedUserService";
import AdminUserService from "@admin/services/AdminUserService";
import SubscriptionProduct from "@shared/models/SubscriptionProduct";
import AdminSubscriptionProductService from "@admin/services/AdminSubscriptionProductService";

const logger = new Logger("SlackCommandJob");
const config = getConfig();

export enum JobType {
    today = "today",
    bigquery = "bigquery",
    durumuru = "durumuru",
    activeUsers = "activeUsers",
    memberStats = "stats",
    user = "user",
}

export interface JobRequest {
    type: JobType,
    payload?: any,
    slackResponseURL?: string,
    channelName?: string,
    userId?: string,
    userName?: string,
}

export async function onPublish(message: Message, context: functions.EventContext) {
    try {
        const job = message.json as JobRequest;
        await processJob(job);
    } catch (error) {
        logger.error("Failed to process SlackCommand job", error);
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
        case JobType.memberStats:
            task = processMemberStats(job);
            break;
        case JobType.user:
            task = processUser(job);
            break;
    }
    if (task) {
        const message = await task;
        const end = new Date();

        const duration = end.getTime() - start.getTime();
        const slackTimestamp = `${ end.getTime() / 1000 }`;
        const attachments = message.attachments || [];

        let lastAttachment = attachments.pop();
        if (!lastAttachment) {
            lastAttachment = { text: "Task Stats" };

        }

        lastAttachment = {
            // text: lastAttachment.text || "Task completed",
            ts: slackTimestamp,
            footer: `\`${ job.type }\` took ${ prettyMilliseconds(duration) }`,
            ...lastAttachment,
        };
        attachments.push(lastAttachment);
        message.attachments = attachments;
        if (!message.response_type) {
            logger.log("defaulting the response type to ephemeral");
            message.response_type = SlackResponseType.ephemeral;
        }

        if (job.slackResponseURL) {
            await AdminSlackService.getSharedInstance().sendToResponseUrl(job.slackResponseURL, message);
        } else if (job.channelName) {
            await AdminSlackService.getSharedInstance().sendArbitraryMessage(job.channelName, message as ChatMessage);
        }

        if (message.fileData && (job.channelName || job.userId)) {
            await AdminSlackService.getSharedInstance().uploadTextSnippet({
                data: message.fileData,
                channels: [job.channelName,].filter(Boolean) as string[],
                useChannelId: true,
                fileType: "json",
                filename: `${ job.type ?? "job" }-results.json`,
            })
        }

        logger.log(`Finished processing SlackCommand ${ job.type }`);
    } else {
        logger.warn("No task was created for job", JSON.stringify(job, null, 2));
    }
}

/**
 * Get information about a user and return it to slack.
 * @param {JobRequest} job
 * @return {Promise<SlashCommandResponse>}
 */
async function processUser(job: JobRequest): Promise<SlashCommandResponse> {
    logger.log("Getting user info ");
    const email = job.payload as string;

    const member = await AdminCactusMemberService.getSharedInstance().getMemberByEmail(email);
    const userRecord = await AdminUserService.getSharedInstance().getAuthUserByEmail(email)

    const subscriptionProductId = member?.subscription?.subscriptionProductId;
    let subscriptionProduct: SubscriptionProduct | null = null;
    if (subscriptionProductId) {
        subscriptionProduct = await AdminSubscriptionProductService.getSharedInstance().getByEntryId(subscriptionProductId) ?? null;
    }

    let text = `No user found for email ${ email }`;
    const attachments: SlackAttachment[] = [];
    if (member || userRecord) {
        const envSuffix = config.app.environment === "prod" ? "prod" : "stage"
        const revenueCatAppId = config.revenuecat.app_id;
        const firebaseLink = `https://console.firebase.google.com/u/0/project/cactus-app-${ envSuffix }/database/firestore/data~2Fmembers~2F${ member!.id }`;
        text = `User info for ${ email }`;

        const accessEndsAt = member?.subscription?.cancellation?.accessEndsAt;
        const trialStartedAt = member?.subscription?.optOutTrial?.startedAt;
        attachments.push({
            fields: [
                {
                    title: "Member ID / User ID",
                    value: (member?.id ? `<${ firebaseLink }|${ member?.id }>` : "--") + ` / ${ userRecord?.uid ?? "--" }`,
                },
                { title: "Email", value: member?.email ?? email },
                {
                    title: "Created At",
                    value: formatDateTime(member?.createdAt, { timezone: AmericaDenverTimezone }) ?? "--"
                },
                {
                    title: "Source / Medium / Campaign: ",
                    value: `${ member?.getSignupSource() ?? "--" } / ${ member?.getSignupMedium() ?? "--" } / ${ member?.getSignupCampaign() ?? "--" }`
                },
                {
                    title: "Subscription",
                    value: `*Tier*: ${ member?.tier ?? "--" }
*In Trial*: ${ member?.isOptOutTrialing === true ? "Yes" : "No" }
*Plan Duration* ${ subscriptionProduct?.billingPeriod ?? "--" }
*Price* ${ subscriptionProduct?.priceCentsUsd ? formatPriceCentsUsd(subscriptionProduct.priceCentsUsd) : "--" }
*Trial Started At*: ${ formatDateTime(trialStartedAt, { timezone: AmericaDenverTimezone }) ?? "--" }
*Cancels At*: ${ formatDateTime(accessEndsAt, { timezone: AmericaDenverTimezone }) ?? "--" }
                    `.trim(),
                },
                {
                    title: "Stats",
                    value: `*Streak (Days)*: ${ member?.stats.reflections?.currentStreakDays ?? 0 }
*Total Reflections*: ${ member?.stats?.reflections?.totalCount ?? 0 }`,
                },
                {
                    title: "Links",
                    value: `<https://app.revenuecat.com/customers/${ revenueCatAppId }/${ member?.id }|RevenueCat>
<${ firebaseLink }|Firebase Member Record>
`
                },

            ]
        })
    }
    const fileData = stringifyJSON({ member: member?.toJSON(), userRecord: userRecord?.toJSON() }, 2);
    return { text, attachments, fileData, response_type: SlackResponseType.in_channel };
}

async function processMemberStats(job: JobRequest): Promise<SlashCommandResponse> {
    logger.log("Getting member stats");
    const email = job.payload as string;

    if (!isValidEmail(email)) {
        return {
            text: `:shrug: Unable to fetch stats for email ${ email }. The email was invalid.`,
            response_type: SlackResponseType.ephemeral
        };
    }

    const member = await AdminCactusMemberService.getSharedInstance().getMemberByEmail(email);
    const memberId = member?.id;
    const timeZone = member?.timeZone || undefined;
    if (!memberId) {
        return {
            text: `:face_with_symbols_on_mouth: Unable to find a member with email ${ email }`,
            response_type: SlackResponseType.ephemeral
        }
    }

    const [stats] = await Promise.all([
        AdminReflectionResponseService.getSharedInstance().calculateStatsForMember({
            memberId,
            timeZone
        })
    ]);

    if (!stats) {
        const message = `Unable to calculate stats for member ${ email }. No value was returned from the \`calculateStatsForMember\` method.`
        logger.warn(message);
        return {
            text: message,
            response_type: SlackResponseType.ephemeral,
        }
    }

    logger.info("Got member stats", stringifyJSON(stats, 2));

    const fields: SlackAttachmentField[] = [
        {
            title: "Time Zone",
            value: `${ timeZone || "Not Found on Member" }`,
            short: true
        },
        {
            title: "Streak",
            value: `${ stats.currentStreakDays }`,
            short: true,
        },
        {
            title: "Total Reflections",
            value: `${ stats.totalCount }`,
            short: true
        },
        {
            title: "Minutes Reflected",
            value: `${ millisecondsToMinutes(stats.totalDurationMs) }`,
            short: true,
        },
        {
            title: "Elements",
            value: `${ Object.keys(stats.elementAccumulation).map(key => {
                return `${ key }: ${ stats.elementAccumulation[key as CactusElement] }`
            }).join("\n") }`
        }
    ];

    const attachments = [{
        fields: fields,
        color: AttachmentColor.info,
    }];
    return {
        text: `Stats for ${ email }`,
        attachments,
        response_type: SlackResponseType.in_channel
    };
}

async function processToday(job: JobRequest): Promise<SlashCommandResponse> {
    logger.log("Getting today's stuff");
    const todayDate = getDateAtMidnightDenver(new Date());
    logger.log(`Date for today: ${ formatDateTime(todayDate) }`);

    const [todayFields, allTimeFields] = await Promise.all([
        getTodayStatFields(todayDate),
        getAllTimeStatFields(),
    ]);

    const attachments = [{
        title: `Today's Stats`,
        text: `Events since ${ formatDateTime(todayDate, { timezone: AmericaDenverTimezone }) }`,
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

/**
 * Get stats about the activity that occurred on a given date.
 * @param {Date} todayDate
 * @return {Promise<SlackAttachmentField[]>}
 */
async function getTodayStatFields(todayDate: Date): Promise<SlackAttachmentField[]> {
    const todayFields: SlackAttachmentField[] = [];

    const [allMembers,
        allResponses,
        deletedUsers,
        trialStartMembers,
        cancellationInitiatedMembers,
        trialConvertedMembers,
        offersApplied,
        offersRedeemed,
    ] = await Promise.all([
        AdminCactusMemberService.getSharedInstance().getMembersCreatedSince(todayDate),
        AdminReflectionResponseService.getSharedInstance().getResponseSinceDate(todayDate),
        AdminDeletedUserService.getSharedInstance().getAllSince(todayDate),
        AdminCactusMemberService.getSharedInstance().getOptOutTrialStartedSince(todayDate),
        AdminCactusMemberService.getSharedInstance().getCancellationsInitiatedSince(todayDate),
        AdminCactusMemberService.getSharedInstance().getOptTrialsConvertedToPaidSince(todayDate),
        AdminCactusMemberService.getSharedInstance().getPromotionalOffersAppliedOn(todayDate),
        AdminCactusMemberService.getSharedInstance().getPromotionalOffersRedeemedOn(todayDate),
    ]) as [
        CactusMember[],
        ReflectionResponse[],
        DeletedUser[],
        CactusMember[],
        CactusMember[],
        CactusMember[],
        CactusMember[],
        CactusMember[],
    ];

    logger.log(`All tasks have completed for Today Stats for ${ getISODate(todayDate) }`);

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

    interface ResponseByMedium {
        [medium: string]: number
    }

    const reflectionResponsesByMedium: ResponseByMedium = allResponses.reduce((map: ResponseByMedium, response: ReflectionResponse) => {
        const medium = response.responseMedium || "Unknown";
        map[medium] = (map[medium] || 0) + 1;
        return map;
    }, {});

    const sortedResponseStats = Object.entries(reflectionResponsesByMedium).sort(([, v1], [, v2]) => {
        return v2 - v1
    }).map(([medium, count]) => {
        return `\`${ getResponseMediumDisplayName(medium) }\` - ${ count }`
    });

    const memberIdsReflected = allResponses.map(rr => rr.cactusMemberId);
    const countMembersReflected = Array.from(new Set(memberIdsReflected)).length;

    sortedResponseStats.unshift(`\`TOTAL\` - ${ allResponses.length } from ${ countMembersReflected } members`);


    const offersMap: Record<string, {redeemed: number, applied: number}> = {};
    offersApplied.forEach(a => {
        const name = a.currentOffer?.displayName;
        if (!name) {
            return;
        }
        const r = offersMap[name] ?? {redeemed: 0, applied: 0};
        r.applied += 1;
    })

    offersRedeemed.forEach(m => {
        const name = m.currentOffer?.displayName;
        if (!name) {
            return;
        }
        const r = offersMap[name] ?? {redeemed: 0, applied: 0};
        r.redeemed += 1;
    })


    const offerFieldValue = Object.keys(offersMap).map(offerName => {
        const {redeemed, applied} = offersMap[offerName]
        return `\`${offerName}\` - ${redeemed} / ${applied} (${applied > 0 ? (redeemed/applied).toFixed(1) : "∞"}%)`;
    }).join('\n')

    todayFields.push({
        title: `Sign Ups`,
        value: `${ confirmedMemberCount }`,
        short: false,
    },
    {
        title: "Reflection Responses",
        value: `${ sortedResponseStats.join("\n") }`,
        short: false
    }, {
        title: "Referrers",
        value: `${ Object.entries(topReferrers).sort(([, v1], [, v2]) => v2 - v1).map(([email, count]) => {
            return `${ email }: ${ count }`
        }).join("\n") || "None" }`
    },
    {
        title: "Offers: Redeemed / Applied",
        value: offerFieldValue,
    },
    {
        title: "Deleted Users",
        value: `${ deletedUsers.length }`
    },
    {
        title: "Trials Starts",
        value: `${ trialStartMembers.length }`
    },
    {
        title: "Trials Converted to Paid",
        value: `${ trialConvertedMembers.length }`
    },
    {
        title: "Subscription Cancellations Initiated",
        value: `${ cancellationInitiatedMembers.length }`
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

        const referralEmail = member.referredByEmail || (member.mailchimpListMember && member.mailchimpListMember.merge_fields.REF_EMAIL as string);

        if (referralEmail) {
            stats.referrals = stats.referrals + 1;
            stats.referrers[referralEmail] = (stats.referrers[referralEmail] || 0) + 1;
        }

        return stats;
    }, { confirmed: 0, unsubscribed: 0, referrals: 0, referrers: {} });

    const uniqueReferrers = Object.keys(memberStats.referrers).length;
    // const topReferrersString = Object.entries(memberStats.referrers).sort(([, v1], [, v2]) => v2 - v1).slice(0, 20).map(([email, count]) => {
    //     return `${email}: ${count}`
    // }).join("\n") || "None";

    return [
        {
            title: "Sign Ups ",
            value: `${ memberStats.confirmed }`,
            short: true,

        },
        {
            title: "Unsubscribes ",
            value: `${ memberStats.unsubscribed }`,
            short: true,
        },
        {
            title: "Referral Sign Ups",
            value: `${ (100 * memberStats.referrals / memberStats.confirmed).toFixed(2) }% (${ memberStats.referrals }/${ memberStats.confirmed })`,
            short: true,

        },
        {
            title: "Unique Referrers ",
            value: `${ (100 * uniqueReferrers / memberStats.confirmed).toFixed(2) }% (${ uniqueReferrers }/${ memberStats.confirmed })`,
            short: true,
        },
        {
            title: ":datastudio: DURU/MURU ",
            value: `${ (durumuru.durumuru * 100).toFixed(2) }% (${ durumuru.today }/${ durumuru.l30 })`,
            short: true,
        },
        // {
        //     title: "Top 20 Referrers",
        //     value: topReferrersString,
        //     short: false,
        // }
    ]
}

async function processBigQuery(job: JobRequest): Promise<SlashCommandResponse> {
    const pubsub = new PubSub();
    await pubsub.topic(PubSubTopic.firestore_export_bigquery).publishJSON({});


    return {
        text: `BigQuery export job started for project ${ config.web.domain }. This process typically takes about 5 minutes before results show up in <Data Studio|https://datastudio.google.com/u/0/reporting/13ZD824pAbhdTWyybDzITow4V0vFgIEqC/page/aZQu>`,
        response_type: SlackResponseType.ephemeral
    };
}

async function getDurumuru(): Promise<{ l30: number, today: number, durumuru: number }> {
    logger.log("fetching duru/muru");
    const activeUsersToday = await getActiveUserCountForTrailingDays(1);
    const activeUsersL30 = await getActiveUserCountForTrailingDays(30);

    return { l30: activeUsersL30, today: activeUsersToday, durumuru: activeUsersToday / activeUsersL30 }
}

async function processDurumuru(job: JobRequest): Promise<SlashCommandResponse> {
    let days = 1;
    if (job.payload.length > 0) {
        const [dayArg] = job.payload;
        days = Number(dayArg);
    }

    logger.log("getting active users for last ", days);
    const durumuruSummary = await getDurumuru();
    return {
        response_type: SlackResponseType.in_channel,
        attachments: [
            {
                title: `${ (durumuruSummary.durumuru).toFixed(3) } (${ durumuruSummary.today }/${ durumuruSummary.l30 }) is today's DURU/MURU :sunny: /:spiral_calendar_pad: `,
                text: `That is, ${ durumuruSummary.today } unique users have reflected in the last 24 hours, and ${ durumuruSummary.l30 } unique users have reflected in the last 30 days.`
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

    logger.log("getting active users for last ", days);
    const activeUsers = await getActiveUserCountForTrailingDays(days);

    return {
        text: `There have been *${ activeUsers }* unique users with a reflection response over the last *${ days }* days`,
        response_type: SlackResponseType.ephemeral
    }
}

export function getSlackHelpText(): { intro: string, commands: string } {
    const commandDescriptions: string[] = [];
    const commands = getCommandDescriptions();
    Object.keys(commands).forEach(name => {
        commandDescriptions.push(`\`${ name }\` - ${ commands[name] }\n`);
    });

    const intro = `The \`/cactus\` slash command can be used to interact with Cactus data in different ways. The command format is ` +
    `\`/cactus [command] [parameters]\` ` +
    `where multiple \`parameters\` are space separated values.`;

    const commandText = `\n\n*Available Commands*:\n${ commandDescriptions.join("\n").trim() }`;

    return { intro, commands: commandText };
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