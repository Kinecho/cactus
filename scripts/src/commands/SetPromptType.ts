import { FirebaseCommand } from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import { CactusConfig } from "@admin/CactusConfig";
import { Project } from "@scripts/config";
import * as prompts from "prompts";
import AdminReflectionPromptService from "@admin/services/AdminReflectionPromptService";
import Logger from "@shared/Logger"
import ReflectionPrompt, { PromptType } from "@shared/models/ReflectionPrompt";

const logger = new Logger("SetPromptType");


interface UserInput {
    ready: boolean
}

export default class SetPromptType extends FirebaseCommand {
    name = "Set Prompt Type";
    description = "Backfill prompt type";
    showInList = true;
    userInput!: UserInput;

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);

        const userInput: UserInput = await prompts([{
            name: "ready",
            message: "Ready to do the backfill to type = CACTUS?",
            type: "confirm"
        }]);
        console.log("Got user input", userInput);
        this.userInput = userInput;

        if (!userInput.ready) {
            return;
        }

        await AdminReflectionPromptService.getSharedInstance().getAllBatch({
            includeDeleted: true,
            batchSize: 100,
            onData: async (results, batchNumber) => {
                logger.info(`Processing batch ${ batchNumber }`);
                let batchWriteCount = 0;
                const write = AdminFirestoreService.getSharedInstance().getBatch();
                results.forEach(prompt => {
                    const promptId = prompt.id;
                    if (!promptId) {
                        logger.info(`prompt doesn't have an ID, skipping`);
                        return;
                    }
                    logger.info(`Processing promptId ${ promptId } with type ${ prompt.promptType }`);
                    const ref = AdminReflectionPromptService.getSharedInstance().getCollectionRef().doc(promptId)
                    const promptType = prompt.promptType ?? PromptType.CACTUS;
                    write.update(ref, { [ReflectionPrompt.Field.promptType]: promptType });
                    batchWriteCount++;
                })
                await write.commit();
                logger.info(`Committing batch with ${ batchWriteCount } writes in the batch.`);
                // logger.info("Write result: ", writeResult);
                return;
            }
        })

        return;
    }

}