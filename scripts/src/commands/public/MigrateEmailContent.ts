import {FirebaseCommand} from "@scripts/run";
import AdminFirestoreService from "@shared/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {Collection} from "@shared/FirestoreBaseModels";
import FieldValue = admin.firestore.FieldValue;
import chalk from "chalk";
// import FieldValue = admin.firestore.FieldValue;

export default class MigrateEmailContent extends FirebaseCommand {
    constructor() {
        super();
        this.name = "Migrate Email Content";
        this.description = "This command will convert the top-level html & text properties into a nested \"content\" object on every EmailReply in the database. There is no un-do script written.";
        this.confirmExecution = true;
    }

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService): Promise<void> {
        const collection = firestoreService.getCollectionRef(Collection.emailReply);
        const snapshot = await collection.get();
        let updatedCount = 0;
        let documentCount = 0;
        const tasks:Promise<void>[] = [];
        snapshot.forEach(doc => {
            tasks.push(new Promise(async (resolve, reject) => {
                documentCount++;
                // const model = await fromDocumentSnapshot(doc, EmailReply);
                // Note: not using the data model because we want to remove fields
                const model = doc.data();
                const content = model.content || {};

                if (!model){
                    console.warn("Unable to get model from snapshot");
                    return;
                }
                let needsUpdate = false;
                if (!content.html && model.html){
                    console.log(`[${model.id}]need to set html content`);
                    content.html = model.html;
                    needsUpdate = true;
                }
                if (!content.text && model.text){
                    console.log(`[${model.id}]need to set text content`);
                    content.text = model.text;
                    needsUpdate = true;
                }

                if (needsUpdate){
                    await doc.ref.update({
                        html: FieldValue.delete(),
                        text: FieldValue.delete(),
                        content: content
                    });
                    updatedCount++;
                    resolve()
                } else {
                    resolve();
                }
            }))
        });

        await Promise.all(tasks);
        console.log(chalk.green(`\n***************\nUpdated ${updatedCount}/${documentCount} documents`));
        // console.log()

        return;
    }

}