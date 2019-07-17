import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@shared/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {Project} from "@scripts/config";
import {CactusConfig} from "@shared/CactusConfig";
import {DocumentSnapshot} from "firebase-functions/lib/providers/firestore";
import chalk from "chalk";
import AdminSentPromptService from "@shared/services/AdminSentPromptService";

const prompts = require("prompts");

export default class SentPromptCreatedAtBackfillCommand extends FirebaseCommand {
    name = "Sent Prompt: createdAt Backfill Command";
    description = "";
    showInList = true;

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);


        const query = AdminSentPromptService.getSharedInstance().getCollectionRef();

        const snapshot = await query.get();
        const missingCreatedAt: DocumentSnapshot[] = [];
        const hasCreatedAt: DocumentSnapshot[] = [];

        snapshot.forEach(doc => {
            if (!doc.get("createdAt")) {
                missingCreatedAt.push(doc);
            } else {
                hasCreatedAt.push(doc);
            }
        });


        console.log(`Has createdAt count ${hasCreatedAt.length}`);
        console.log(`Missing createdAt count ${missingCreatedAt.length}\nMissing IDs:\n`);
        console.log(chalk.cyan(`${missingCreatedAt.map(doc => doc.id).join("\n")}`));

        const continueResponse: { continue: boolean } = await prompts({
            name: "continue",
            message: "Do you want to back-fill these items now?",
            type: "confirm"
        });

        if (continueResponse) {
            const updateTasks = missingCreatedAt.map(doc => this.setCreatedAt(doc));
            try {
                await Promise.all(updateTasks);
                console.log(`successfully updated responses! Updated Count: ${updateTasks.length}`);
            } catch (error) {
                console.error("Error updating responses", error);
            }
        }


        return;
    }

    setCreatedAt(doc:DocumentSnapshot){
        return new Promise(async resolve => {
            const updatedAt = doc.get("updatedAt");
            if (updatedAt){
                await doc.ref.update({createdAt: updatedAt});
            }
            resolve();
        })
    }

}