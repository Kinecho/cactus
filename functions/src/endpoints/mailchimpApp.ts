// import * as functions from "firebase-functions"
import * as express from "express";
import * as cors from "cors";
import {
    sendActivityNotification,
    SlackMessage,
    SlackAttachment,
    getAttachmentForObject
} from "@api/slack/slack"

import SubscriptionRequest from "@shared/mailchimp/models/SubscriptionRequest";
import SubscriptionResult, {SubscriptionResultStatus} from "@shared/mailchimp/models/SubscriptionResult";
import ApiError from "@shared/ApiError";
import {writeToFile} from "@api/util/FileUtil";
import {
    CampaignEventData,
    CleanedEmailEventData, EmailChangeEventData,
    EventType, ProfileUpdateEventData, SubscribeEventData,
    UnsubscribeEventData,
    WebhookEvent
} from "@shared/mailchimp/models/MailchimpTypes";
import {saveSentCampaign} from "@api/services/sentCampaignService";
import MailchimpService from "@shared/services/MailchimpService";
import AdminCactusMemberService from "@shared/services/AdminCactusMemberService";
import AdminSentPromptService from "@shared/services/AdminSentPromptService";
// import AdminUserService from "@shared/services/AdminUserService";


const app = express();

const mailchimpService = MailchimpService.getSharedInstance();
const sentPromptService = AdminSentPromptService.getSharedInstance();
// const userService = AdminUserService.getSharedInstance();

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

    let message: string | SlackMessage = "";
    // let data = event.data;
    switch (event.type) {
        case EventType.unsubscribe:
            // const unsub = data as Uns
            const unsub = event.data as UnsubscribeEventData;
            message = `${unsub.email} has unsubscribed. Campaign ID: ${unsub.campaign_id}. Reason = ${unsub.reason}`;
            break;
        case EventType.subscribe:
            //already have a hook for this
            console.log("webhook received for subscribe");
            const data = event.data as SubscribeEventData;
            const listMember = await mailchimpService.getMemberByEmail(data.email);
            if (listMember) {
                const cactusMember = await AdminCactusMemberService.getSharedInstance().updateFromMailchimpListMember(listMember);
                if (cactusMember) {
                    await sendActivityNotification(`${data.email} has confirmed their subscription. They have been added ${data.email} to database. CactusMember ID = ${cactusMember.id}`)
                } else {
                    await sendActivityNotification(`:warning: Unable to sync listMember with database for ${data.email}`);
                }
            } else {
                await sendActivityNotification(`:warning: Unable to sync listMember with database for ${data.email}`);
            }

            break;
        case EventType.profile:
            const profile = event.data as ProfileUpdateEventData;
            const attachment = getAttachmentForObject(profile.merges);
            attachment.color = "#FFE4DA";
            message = {
                text: `${profile.email} updated their profile`,
                attachments: [attachment]
            };

            const profileMember = await mailchimpService.getMemberByEmail(profile.email);
            if (profileMember) {
                const cactusMember = await AdminCactusMemberService.getSharedInstance().updateFromMailchimpListMember(profileMember);
                if (cactusMember) {
                    await sendActivityNotification(`Updated ${profile.email} in our database. CactusMember ID = ${cactusMember.id}`)
                } else {
                    await sendActivityNotification(`:warning: Unable to sync listMember with database for ${profile.email}`);
                }
            } else {
                await sendActivityNotification(`:warning: Unable to sync listMember with database for ${profile.email}`);
            }

            break;
        case EventType.upemail:
            const update = event.data as EmailChangeEventData;
            message = `${update.old_email} changed their email to ${update.new_email} on list_id = ${update.list_id}`;
            break;
        case EventType.cleaned:
            const cleaned = event.data as CleanedEmailEventData;
            message = `Cleaned email ${cleaned.email} from list. Reason = ${cleaned.reason}`;
            break;
        case EventType.campaign:
            const campaignData = event.data as CampaignEventData;
            const campaign = await mailchimpService.getCampaign(campaignData.id);
            const content = await mailchimpService.getCampaignContent(campaignData.id);

            //this will create the link in the reflection prompt;
            const sentCampaign = await saveSentCampaign(campaign, campaignData, content);
            if (sentCampaign) {
                await sentPromptService.processSentMailchimpCampaign({
                    campaignId: campaignData.id,
                    promptId: sentCampaign.reflectionPromptId
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

            message = {
                attachments: [{
                    title: `:email: An email campaign was sent!`,
                    color: "#29A389",
                    fields: fields,
                    ts: campaign ? `${(new Date(campaign.send_time)).getTime() / 1000}` : undefined,
                }]
            };

            break;
    }

    await sendActivityNotification(message);

    res.send({success: true})
});

app.post("/", async (req: express.Request, res: express.Response) => {
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

            const slackResult = await sendActivityNotification(message);
            console.log("slack result", slackResult);
        } else if (!signupResult.success) {
            await sendActivityNotification(`An error occurred while signing up \`${subscription.email}\`. They were not added to mailchimp. \n\n \`\`\`${JSON.stringify(signupResult.error)}\`\`\``)
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

export default app;

