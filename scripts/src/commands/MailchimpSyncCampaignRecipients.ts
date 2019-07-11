import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@shared/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {getCactusConfig, Project} from "@scripts/config";
import MailchimpService from "@shared/services/MailchimpService";
import {SentToRecipient} from "@shared/mailchimp/models/MailchimpTypes";
import AdminReflectionPromptService from "@shared/services/AdminReflectionPromptService";
import AdminSentPromptService, {CampaignSentPromptProcessingResult} from "@shared/services/AdminSentPromptService";
import AdminCactusMemberService from "@shared/services/AdminCactusMemberService";

const prompts = require("prompts");

export default class MailchimpSyncCampaignRecipients extends FirebaseCommand {
    name = "Mailchimp: Sync Campaign Recipients";
    description = "List all of the recipients of a given campaign";
    showInList = true;

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);

        const config = await getCactusConfig(project);
        AdminFirestoreService.initialize(app);
        MailchimpService.initialize(config.mailchimp.api_key, config.mailchimp.audience_id);
        AdminCactusMemberService.initialize();
        AdminReflectionPromptService.initialize();
        AdminSentPromptService.initialize();

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
                if (prompt && prompt.id) {
                    tasks.push(new Promise<CampaignSentPromptProcessingResult>(async resolve => {
                        const sentPrompt = await AdminSentPromptService.getSharedInstance().processMailchimpRecipient(recipient, prompt.id as string);
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