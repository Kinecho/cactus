// import * as functions from "firebase-functions"
import * as express from "express";
import * as cors from "cors";
import SignupRequest from "@shared/mailchimp/models/SignupRequest";
import SubscriptionResult, { SubscriptionResultStatus } from "@shared/mailchimp/models/SubscriptionResult";
import ApiError from "@shared/api/ApiError";
import { writeToFile } from "@api/util/FileUtil";
import {
    CampaignEventData,
    CleanedEmailEventData,
    EmailChangeEventData,
    EventType,
    ListMemberStatus,
    MemberUnsubscribeReport,
    ProfileUpdateEventData,
    SubscribeEventData,
    UnsubscribeEventData,
    WebhookEvent
} from "@shared/mailchimp/models/MailchimpTypes";
import { saveSentCampaign } from "@api/services/sentCampaignService";
import MailchimpService from "@admin/services/MailchimpService";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import { submitJob } from "@api/pubsub/subscribers/ProcessMailchimpCampaignRecipientsJob";
import AdminSlackService, {
    ChannelName,
    ChatMessage,
    SlackAttachment,
    SlackAttachmentField,
    SlackMessage
} from "@admin/services/AdminSlackService";
import AdminReflectionPromptService from "@admin/services/AdminReflectionPromptService";
import CactusMember, { NotificationStatus } from "@shared/models/CactusMember";
import { getISODate } from "@shared/util/DateUtil";
import { UnsubscribeRequest, UpdateStatusRequest } from "@shared/mailchimp/models/UpdateStatusTypes";
import { getConfig, isNonPromptCampaignId } from "@admin/config/configService";
import Logger from "@shared/Logger";
import { updateEmailPreferences } from "@api/endpoints/userEndpoints";

const logger = new Logger("mailchimpEndpoints");
const app = express();
const Config = getConfig();
// Automatically allow cross-origin requests
app.use(cors({origin: Config.allowedOrigins}));

app.get("/", async (req: express.Request, res: express.Response) => {
    return res.send({success: true, message: "got the get request"})
});


app.post("/webhook", async (req: express.Request, res: express.Response) => {
    const event = req.body as WebhookEvent;
    logger.log("webhook event", JSON.stringify(event));
    const date = new Date();
    const dateId = date.getTime();
    await writeToFile(`output/webhook/${dateId}-mailchimp.json`, JSON.stringify(event));

    // let message: string | SlackMessage = "";
    // let data = event.data;
    switch (event.type) {
        case EventType.unsubscribe:
            // const unsub = data as Uns
            const unsub = event.data as UnsubscribeEventData;
            await handleUnsubscribeEvent(unsub);
            break;
        case EventType.subscribe:
            //already have a hook for this
            logger.log("webhook received for subscribe");
            const data = event.data as SubscribeEventData;
            await handleSubscribeEvent(data);
            break;
        case EventType.profile:
            const profile = event.data as ProfileUpdateEventData;
            await handleProfileEvent(profile);
            break;
        case EventType.upemail:
            const update = event.data as EmailChangeEventData;
            await handleEmailUpdatedEvent(update);
            break;
        case EventType.cleaned:
            const cleaned = event.data as CleanedEmailEventData;
            await handleCleanedEvent(cleaned);
            // message = `Cleaned email ${cleaned.email} from list. Reason = ${cleaned.reason}`;
            break;
        case EventType.campaign:
            const campaignData = event.data as CampaignEventData;
            await handleCampaignEvent(campaignData);
            break;
    }

    res.send({success: true})
});

app.post("/", async (req: express.Request, res: express.Response) => {

    const mailchimpService = MailchimpService.getSharedInstance();
    const slackService = AdminSlackService.getSharedInstance();
    logger.log("request params", req.body);
    const subscription = SignupRequest.fromData(req.body);
    res.contentType("application/json");


    // const userResult = await userService.signupSubscriber(subscription);
    // logger.log("userResult", userResult);

    try {
        const signupResult = await mailchimpService.addSubscriber(subscription);
        logger.log("singed up with result", signupResult);

        if (signupResult.status === SubscriptionResultStatus.new_subscriber) {
            logger.log("new user signed up successfully");
            const fields = [
                {
                    title: "Email",
                    value: subscription.email,
                    short: false
                }
            ];


            const attachmentSummary: SlackAttachment = {
                color: "#33CCAB",
                ts: `${(new Date()).getTime() / 1000}`,
                fields: fields
            };

            if (subscription.firstName || subscription.lastName) {
                fields.push({
                    title: "Name",
                    value: `${subscription.firstName} ${subscription.lastName}`.trim(),
                    short: false
                });
            }

            if (subscription.referredByEmail) {
                fields.push({
                    title: "Referred By",
                    value: subscription.referredByEmail,
                    short: false,
                })
            }


            logger.log("subscription", JSON.stringify(subscription, null, 2));
            if (subscription.subscriptionLocation) {
                logger.log("adding footer to message");
                attachmentSummary.footer = `${subscription.subscriptionLocation.page} - ${subscription.subscriptionLocation.formId}`;
            } else {
                logger.log("Not adding footer to message");
            }

            const message: SlackMessage = {
                text: "Got a new email (added in Mailchimp as \`Pending\`)!",
                attachments: [attachmentSummary],
            };

            const slackResult = await slackService.sendActivityNotification(message);
            logger.log("slack result", slackResult);
        } else if (!signupResult.success) {
            await slackService.sendActivityNotification(`An error occurred while signing up \`${subscription.email}\`. They were not added to mailchimp. \n\n \`\`\`${JSON.stringify(signupResult.error)}\`\`\``)
        }

        return res.send(signupResult);

    } catch (error) {
        const result = new SubscriptionResult();
        result.success = false;
        const apiError = new ApiError();
        apiError.code = 500;
        apiError.friendlyMessage = "Unable to process your subscription. Please try again later";
        apiError.error = error;
        result.error = apiError;

        // result.member = null;
        result.status = SubscriptionResultStatus.unknown;


        return res.send(result)
    }
});

/**
 * Unsubscribe by mailchimp unique id & email
 */
app.post("/unsubscribe/confirm", async (req: express.Request, res: express.Response) => {
    const payload = req.body as UnsubscribeRequest;
    const {email, mcuid} = payload;

    logger.log(`handing unsubscribe confirm email: ${email}, mcuid: ${mcuid}`);

    const mailchimpMember = await MailchimpService.getSharedInstance().getMemberByUniqueEmailId(mcuid);

    if (!mailchimpMember) {
        res.status(404).send({error: "No member was found for the given ID.", success: false});
        return;
    }

    if (mailchimpMember?.email_address !== email) {
        res.status(409).send({
            error: "Invalid request. The member ID and email address did not match.",
            success: false
        });
        return;
    }
    let member = await AdminCactusMemberService.getSharedInstance().getByMailchimpUniqueEmailId(mcuid);
    if (!member) {
        //try to find by email
        member = await AdminCactusMemberService.getSharedInstance().getMemberByEmail(email);
    }
    if (!member) {
        res.status(404).send({success: false, error: "No member found"});
        return;
    }

    const statusRequest: UpdateStatusRequest = {email: email, status: ListMemberStatus.unsubscribed};
    const response = await MailchimpService.getSharedInstance().updateMemberStatus(statusRequest);

    if (response.success) {
        member.unsubscribedAt = new Date();
        member.notificationSettings.email = NotificationStatus.INACTIVE;
    } else {
        logger.error("The unsubscribe request was not successful");
    }

    if (response.listMember) {
        logger.log("Updating the cactus member with the new mailchimp member");
        member.mailchimpListMember = response.listMember;
    } else {
        logger.log(`No mailchimp list member found. Can't update the cactus member. email = ${email}. mcuid = ${mcuid}`);
    }

    await AdminCactusMemberService.getSharedInstance().save(member);

    await sendSlackUserUnsubscribedEmail({
        cactusMember: member,
        email: statusRequest.email,
        status: statusRequest.status
    });

    res.send({success: response.success, error: response.error})

});

/**
 * @deprecated - use the /users/update-email-preferences endpoint instead
 * We now use both sendgrid and mailchimp for emails, so we need to keep them in both in sync.
 * The users endpoint is more generic and will handle all email services.
 *
 * Because of iOS apps, we need to support this endpoint still. So, just use the correct handler to process the request.
 */
app.put("/status", updateEmailPreferences);

async function sendSlackUserUnsubscribedEmail(options: { email: string, status: ListMemberStatus, cactusMember?: CactusMember }) {
    const {cactusMember, email, status} = options;
    const attachments: SlackAttachment[] = [];
    const fields: SlackAttachmentField[] = [
        {
            title: "Email",
            value: email,
            short: false,
        },
        {
            title: "Reason Code",
            value: `Manually ${status === ListMemberStatus.unsubscribed ? "Unsubscribed" : "Re-Subscribed"} from the App`,
            short: false,
        },

        {
            title: "Cactus Member ID",
            value: (cactusMember ? cactusMember.id : "") || "not found",
            short: false,
        },
        {
            title: "Sign Up Date",
            value: (cactusMember && cactusMember.signupConfirmedAt) ? getISODate(cactusMember.signupConfirmedAt) : "Unknown"
        }
    ];

    attachments.push({
        title: `${email} ${status === ListMemberStatus.unsubscribed ? "Unsubscribed" : "Re-Subscribed"}`,
        fields: fields
    });

    const message = {
        text: `User Has manually ${status === ListMemberStatus.unsubscribed ? "Unsubscribed" : "Re-Subscribed"}`,
        attachments
    };

    await AdminSlackService.getSharedInstance().sendActivityMessage(message);

}

export async function handleCampaignEvent(campaignData: CampaignEventData): Promise<void> {
    const mailchimpService = MailchimpService.getSharedInstance();
    if (campaignData.id && isNonPromptCampaignId(campaignData.id)) {
        logger.log("Skipping campaign as it is not a prompt email");
        return;
    }
    const campaign = await mailchimpService.getCampaign(campaignData.id);
    const content = await mailchimpService.getCampaignContent(campaignData.id);


    //this will create the link in the reflection prompt;
    const sentCampaign = await saveSentCampaign(campaign, campaignData, content);
    if (sentCampaign) {
        await submitJob({
            campaignId: campaignData.id,
            reflectionPromptId: sentCampaign.reflectionPromptId
        });
    }

    const fields = [
        {
            title: "Subject",
            value: campaignData.subject,
            short: true,
        },
        {
            title: "Campaign ID",
            value: campaignData.id,
            short: true,
        },
    ];

    if (campaign) {
        fields.push(
            {
                title: "Send Type",
                value: campaign.type,
                short: true,
            },
            {
                title: "Email URL",
                value: campaign.archive_url,
                short: true,
            },
            {
                title: "Emails Sent",
                value: `${campaign.emails_sent}`,
                short: true,
            })
    }

    const message = {
        text: "Mailchimp Webhook Activity",
        attachments: [{
            title: `:email: An email campaign was sent!`,
            color: "#29A389",
            fields: fields,
            ts: campaign ? `${(new Date(campaign.send_time)).getTime() / 1000}` : undefined,
        }]
    };

    await AdminSlackService.getSharedInstance().sendMessage(ChannelName.email_sends, message)
}

export async function handleSubscribeEvent(eventData: SubscribeEventData): Promise<void> {
    const mailchimpService = MailchimpService.getSharedInstance();
    const slackService = AdminSlackService.getSharedInstance();
    const listMember = await mailchimpService.getMemberByEmail(eventData.email);
    if (listMember) {
        const cactusMember = await AdminCactusMemberService.getSharedInstance().updateFromMailchimpListMember(listMember);
        if (cactusMember) {
            await slackService.sendActivityNotification(`${eventData.email} has confirmed their subscription. They have been added to the database. CactusMember ID = ${cactusMember.id}`)
        } else {
            await slackService.sendActivityNotification(`:warning: Unable to sync listMember with database for ${eventData.email}`);
        }
    } else {
        await slackService.sendActivityNotification(`:warning: Unable to sync listMember with database for ${eventData.email}`);
    }

}

export async function handleEmailUpdatedEvent(update: EmailChangeEventData): Promise<void> {
    const attachments: SlackAttachment[] = [
        {
            title: "Changes",
            fields: [
                {
                    title: "Old Email",
                    value: update.old_email,
                    short: false,
                },
                {
                    title: "New Email",
                    value: update.new_email,
                    short: false,
                },
                {
                    title: "New ID",
                    value: update.new_id,
                    short: false,
                },
                {
                    title: "List ID",
                    value: update.list_id,
                    short: false,
                }
            ]
        }
    ];
    const message: ChatMessage = {text: "Mailchimp Webhook Event: Email Updated", attachments};
    await AdminSlackService.getSharedInstance().sendActivityMessage(message);
}

export async function handleProfileEvent(profile: ProfileUpdateEventData): Promise<void> {
    const mailchimpService = MailchimpService.getSharedInstance();
    const slackService = AdminSlackService.getSharedInstance();

    const attachments: SlackAttachment[] = [];

    const mergeFieldAttachment = AdminSlackService.getAttachmentForObject(profile.merges);
    mergeFieldAttachment.title = "Merge Fields";
    mergeFieldAttachment.color = "#FFE4DA";
    attachments.push(mergeFieldAttachment);

    const profileMember = await mailchimpService.getMemberByEmail(profile.email);
    if (profileMember) {
        const cactusMember = await AdminCactusMemberService.getSharedInstance().updateFromMailchimpListMember(profileMember);
        if (cactusMember) {
            attachments.push({
                text: `Synced ${profile.email} in our database. CactusMember ID = ${cactusMember.id}`,
                color: "good"
            })
        } else {
            attachments.push({
                text: `:warning: Unable to sync listMember with database for ${profile.email}`,
                color: "warning",
            });
        }
    } else {
        // await slackService.sendActivityNotification();
        attachments.push({
            text: `:warning: Unable to sync listMember with database for ${profile.email}`,
            color: "warning",
        })
    }

    const message = {
        text: `Mailchimp Webhook Event: Profile Update\n${profile.email}'s profile was updated.`,
        attachments: attachments,
    };

    await slackService.sendActivityMessage(message);

}

export async function handleUnsubscribeEvent(event: UnsubscribeEventData): Promise<void> {
    const {email, campaign_id: campaignId, reason} = event;
    //TODO: get the unsub reason

    let unsubData: Partial<MemberUnsubscribeReport | undefined> = await MailchimpService.getSharedInstance().getUnsubscribeReportForMember({
        campaignId,
        email
    });
    const mailchimpMember = await MailchimpService.getSharedInstance().getMemberByEmail(email);

    if (!unsubData) {
        unsubData = {timestamp: (new Date()).toISOString()}
    }

    let updatedCactusMember: CactusMember | undefined = undefined;
    if (mailchimpMember) {
        updatedCactusMember = await AdminCactusMemberService.getSharedInstance().updateFromMailchimpListMember(mailchimpMember, unsubData);
    } else {
        updatedCactusMember = await AdminCactusMemberService.getSharedInstance().updateUnsubscribe(unsubData);
    }

    const attachments: SlackAttachment[] = [];
    const fields: SlackAttachmentField[] = [
        {
            title: "Email",
            value: email,
            short: false,
        },
        {
            title: "Reason Code",
            value: reason,
            short: false,
        },
        {
            title: "User Feedback ",
            value: (unsubData && unsubData.reason) ? unsubData.reason : "\`none provided\`",
            short: false,
        },
        {
            title: "Cactus Member ID",
            value: (updatedCactusMember && updatedCactusMember.id) ? updatedCactusMember.id : "not found",
            short: false,
        },
        {
            title: "Sign Up Date",
            value: (updatedCactusMember && updatedCactusMember.signupConfirmedAt) ? getISODate(updatedCactusMember.signupConfirmedAt) : "Unknown"
        }
    ];

    attachments.push({
        title: `${email} unsubscribed`,
        fields: fields
    });

    const message = {text: "Mailchimp Webhook Event: User Unsubscribed", attachments};

    await AdminSlackService.getSharedInstance().sendActivityMessage(message);
}

export async function handleCleanedEvent(event: CleanedEmailEventData): Promise<void> {
    const prompt = await AdminReflectionPromptService.getSharedInstance().getPromptForCampaignId(event.campaign_id);
    const attachments: SlackAttachment[] = [
        {
            title: "Cleaned User",
            color: "warning",
            fields: [
                {
                    title: "Email",
                    value: event.email,
                    short: false,
                },
                {
                    title: "Reason",
                    value: event.reason,
                    short: false,
                },
                {
                    title: "List ID",
                    value: event.list_id,
                    short: false,
                },
                {
                    title: "Campaign/Prompt",
                    value: (prompt && prompt.question) ? prompt.question : `No Prompt found. Campaign ID ${event.campaign_id}`,
                    short: false,
                }
            ]
        }
    ];
    const message: ChatMessage = {text: "Mailchimp Webhook Event: Email Cleaned", attachments};
    await AdminSlackService.getSharedInstance().sendActivityMessage(message);
}

export default app;

