import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@shared/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {getCactusConfig, Project} from "@scripts/config";
import MailchimpService from "@shared/services/MailchimpService";
import {SentToRecipient} from "@shared/mailchimp/models/MailchimpTypes";

const prompts = require("prompts");

export default class MailchimpGetCampaignRecipients extends FirebaseCommand {
    name = "Mailchimp: Get Campaign Recipients";
    description = "List all of the recipients of a given campaign";
    showInList = true;

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);

        const config = await getCactusConfig(project);
        const mailchimpService = new MailchimpService(config.mailchimp.api_key, config.mailchimp.audience_id);

        const campaignResponse: { campaignId: string } = await prompts({
            name: "campaignId",
            message: "What is the mailchimp campaign id?",
            type: "text",
        });


        const printRecipients = async (recipients: SentToRecipient[]) => {
            recipients.forEach(recipient => {
                console.log(`${recipient.email_address} | email_id = ${recipient.email_id} | status=${recipient.status} | lastOpen=${recipient.last_open} | openCount=${recipient.open_count}`)
            })
        };

        const responses = await mailchimpService.getAllSentTo(campaignResponse.campaignId, {
            onPage: printRecipients
        });

        console.log("got all recipients. There were", responses.length);

        return;
    }

}