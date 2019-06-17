import {Command} from "@scripts/run";
import MailchimpQuestionCampaign from "@scripts/commands/MailchimpQuestionCampaign";

export default class MailchimpTest implements Command {
    name = "Mailchimp Test";
    async start():Promise<void> {
        const command = new MailchimpQuestionCampaign();
        command.question = "This is the initial question";
        await command.start();

        return;
    }

}