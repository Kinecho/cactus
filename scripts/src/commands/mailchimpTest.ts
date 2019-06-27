import MailchimpQuestionCampaign from "@scripts/commands/MailchimpQuestionCampaign";
import {Command} from "@scripts/CommandTypes";

export default class MailchimpTest implements Command {
    name = "Mailchimp Test";
    description = "My Test Description";
    showInList = false;

    async start():Promise<void> {
        const command = new MailchimpQuestionCampaign();
        command.question = "What is a food you love?";
        command.contentPath = "https://cactus.app";
        await command.start();

        return;
    }

}