import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {Project} from "@scripts/config";
import MailchimpService from "@admin/services/MailchimpService";
import {CampaignStatus} from "@shared/mailchimp/models/MailchimpTypes";
import {PubSub} from "@google-cloud/pubsub";
import {CampaignRecipientJobPayload, PubSubTopic} from "@shared/types/PubSubTypes";
import {CactusConfig} from "@shared/CactusConfig";

const prompts = require("prompts");

export default class MailchimpSyncCampaignRecipients extends FirebaseCommand {
    name = "Mailchimp: Bulk Sync Campaign Recipients";
    description = "List all of the recipients a set of campaigns via PubSub";
    showInList = true;

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);

        const projectId = app.options.projectId;
        console.log("using project id", projectId);
        const credential = app.options.credential;
        console.log("got credential = ", !!credential);

        const pubsub = new PubSub({projectId: projectId});

        const topic = pubsub.topic(PubSubTopic.process_mailchimp_email_recipients);
        const topicExists = await topic.exists();
        console.log("topic exists: ", topicExists);

        if (!topicExists) {
            console.warn("Topic doesn't exist, exiting");
            return;
        }

        console.log("attempting to initalize mailchimp service");
        const mailchimpService = MailchimpService.getSharedInstance();

        const campaignResponse: { fetchCampaigns: boolean } = await prompts({
            name: "fetchCampaigns",
            message: "get the campaigns ?",
            type: "confirm",
        });

        if (!campaignResponse.fetchCampaigns) {
            console.log("not getting campaigns");
            return;
        }


        const campaigns = await mailchimpService.getAllCampaigns({
            params: {
                status: CampaignStatus.sent,
                list_id: config.mailchimp.audience_id,
                fields: [
                    "campaigns.id",
                    "campaigns.web_id",
                    "campaigns.status",
                    "campaigns.settings.title",
                    "campaigns.send_time",
                    "campaigns.recipients.recipients_count"
                ]

            },
            pagination: {
                count: 300,
            }
        }, 500);


        try {
            const automations = await mailchimpService.getAllAutomationEmailCampaigns(config.mailchimp.audience_id, 200, 500);
            campaigns.push(...automations);
        } catch (e) {
            console.error("unable to fetch automations", e);
        }


        const tasks: Promise<string>[] = [];
        campaigns.forEach(campaign => {
            const campaignId = campaign.id;
            console.log(`Publishing job for ${campaignId}: ${campaign.settings.title} | sendTime = ${campaign.send_time}`);
            const payload: CampaignRecipientJobPayload = {
                campaignId,
            };
            const task = pubsub.topic(PubSubTopic.process_mailchimp_email_recipients).publishJSON(payload);
            tasks.push(task);

        });

        const taskResults = await Promise.all(tasks);
        console.log(`published ${taskResults.length} messages to pubsub`);

        // console.log(JSON.stringify(campaigns, null, 2));


        // console.log("fetched campaigns", JSON.stringify(campaigns, null, 2));

        return;
    }

}