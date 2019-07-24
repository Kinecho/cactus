// import * as functions from "firebase-functions"
import * as express from "express";
import * as cors from "cors";


import SubscriptionRequest from "@shared/mailchimp/models/SubscriptionRequest";
import SubscriptionResult, {SubscriptionResultStatus} from "@shared/mailchimp/models/SubscriptionResult";
import ApiError from "@shared/api/ApiError";
import {writeToFile} from "@api/util/FileUtil";
import {
    CampaignEventData,
    CleanedEmailEventData, EmailChangeEventData,
    EventType, MemberUnsubscribeReport, ProfileUpdateEventData, SubscribeEventData,
    UnsubscribeEventData,
    WebhookEvent
} from "@shared/mailchimp/models/MailchimpTypes";
import {saveSentCampaign} from "@api/services/sentCampaignService";
import MailchimpService from "@shared/services/MailchimpService";
import AdminCactusMemberService from "@shared/services/AdminCactusMemberService";
import {submitJob} from "@api/pubsub/subscribers/ProcessMailchimpCampaignRecipientsJob";
import AdminSlackService, {
    ChatMessage,
    SlackAttachment,
    SlackAttachmentField,
    SlackMessage
} from "@shared/services/AdminSlackService";
import AdminReflectionPromptService from "@shared/services/AdminReflectionPromptService";
import CactusMember from "@shared/models/CactusMember";
import {getISODate} from "@shared/util/DateUtil";

const app = express();


// Automatically allow cross-origin requests
app.use(cors({origin: true}));

app.get("/", async (req: express.Request, res: express.Response) => {
    return res.send({success: true, message: "got the get request"})
});


app.post("/webhook", async (req: express.Request, res: express.Response) => {
    const event = req.body as WebhookEvent;
    console.log("webhook event", JSON.stringify(event));
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
            console.log("webhook received for subscribe");
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
    console.log("request params", req.body);
    const subscription = SubscriptionRequest.fromData(req.body);
    res.contentType("application/json");


    // const userResult = await userService.signupSubscriber(subscription);
    // console.log("userResult", userResult);

    try {
        const signupResult = await mailchimpService.addSubscriber(subscription);
        console.log("singed up with result", signupResult);

        if (signupResult.status === SubscriptionResultStatus.new_subscriber) {
            console.log("new user signed up successfully");
            const fields = [
                {
                    title: "Email",
                    value: subscription.email,
                    short: true
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
                    short: true
                });
            }

            if (subscription.referredByEmail) {
                fields.push({
                    title: "Referred By",
                    value: subscription.referredByEmail,
                    short: true,
                })
            }


            console.log("subscription", JSON.stringify(subscription, null, 2));
            if (subscription.subscriptionLocation) {
                console.log("adding footer to message");
                attachmentSummary.footer = `${subscription.subscriptionLocation.page} - ${subscription.subscriptionLocation.formId}`;
            } else {
                console.log("Not adding footer to message");
            }

            const message: SlackMessage = {
                text: "Got a new signup!",
                attachments: [attachmentSummary],
            };

            const slackResult = await slackService.sendActivityNotification(message);
            console.log("slack result", slackResult);
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


export async function handleCampaignEvent(campaignData: CampaignEventData): Promise<void> {
    const mailchimpService = MailchimpService.getSharedInstance();
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

    await AdminSlackService.getSharedInstance().sendActivityMessage(message)
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

