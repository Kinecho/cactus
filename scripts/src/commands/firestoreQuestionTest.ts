import {Command} from "@scripts/run";
import {SaveQuestionCommand} from "@scripts/commands/createPage";
import {Project} from "@scripts/config";

export default class FirestoreQuestionTest implements Command {
    name = "Firestore Question Test";
    async start():Promise<void> {
        const command = new SaveQuestionCommand(Project.STAGE);

        await command.start();

        return;
    }

}