import {Command} from "@scripts/run";
import MailchimpQuestionCampaign from "@scripts/commands/public/MailchimpQuestionCampaign";

export default class MailchimpTest implements Command {
    name = "Mailchimp Test";
    async start():Promise<void> {
        const command = new MailchimpQuestionCampaign();
        command.question = "What is a food you love?";
        command.contentPath = "https://cactus.app";
        await command.start();

        return;
    }

}