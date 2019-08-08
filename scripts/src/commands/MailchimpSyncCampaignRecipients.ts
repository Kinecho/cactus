import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {Project} from "@scripts/config";
import MailchimpService from "@admin/services/MailchimpService";
import {SentToRecipient} from "@shared/mailchimp/models/MailchimpTypes";
import AdminReflectionPromptService from "@admin/services/AdminReflectionPromptService";
import AdminSentPromptService, {CampaignSentPromptProcessingResult} from "@admin/services/AdminSentPromptService";

const prompts = require("prompts");

export default class MailchimpSyncCampaignRecipients extends FirebaseCommand {
    name = "Mailchimp: Sync Campaign Recipients";
    description = "List all of the recipients of a given campaign";
    showInList = true;

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);

        console.log("attempting to initalize mailchimp service");
        const mailchimpService = MailchimpService.getSharedInstance();

        const campaignResponse: { campaignId: string } = await prompts({
            name: "campaignId",
            message: "What is the mailchimp campaign id?",
            type: "text",
        });


        const prompt = await AdminReflectionPromptService.getSharedInstance().getPromptForCampaignId(campaignResponse.campaignId);
        console.log("Got prompt", prompt ? `${prompt.id} | ${prompt.question}` : 'undefined');

        const tasks: Promise<CampaignSentPromptProcessingResult>[] = [];
        const handleBatch = async (recipients: SentToRecipient[]) => {
            recipients.forEach(recipient => {
                console.log(`${recipient.email_address} | email_id = ${recipient.email_id} | status=${recipient.status} | lastOpen=${recipient.last_open} | openCount=${recipient.open_count}`)
                if (prompt) {
                    tasks.push(new Promise<CampaignSentPromptProcessingResult>(async resolve => {
                        const sentPrompt = await AdminSentPromptService.getSharedInstance().processMailchimpRecipient(recipient, prompt);
                        console.log("processed SentPrompt", sentPrompt);
                        resolve({sentPrompt, recipient});
                    }))
                }


            })
        };
        const responses = await mailchimpService.getAllSentTo(campaignResponse.campaignId, {
            onPage: handleBatch
        });


        console.log("got all recipients. There were", responses.length);
        const taskResults = await Promise.all(tasks);
        console.log("Task results finished", taskResults.length);
        return;
    }

}