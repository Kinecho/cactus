import { FirebaseCommand } from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import { CactusConfig } from "@admin/CactusConfig";
import { Project } from "@scripts/config";
import * as prompts from "prompts";
import { NotificationStatus } from "@shared/models/CactusMember";
import Logger from "@shared/Logger"
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";

const logger = new Logger("SetEmailPreferences");


interface UserInput {
    excludedEmails: string[],
}

export default class SetEmailPreferences extends FirebaseCommand {
    name = "Set Email Preferences";
    description = "";
    showInList = true;
    userInput!: UserInput;

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);

        const userInput: UserInput = await prompts([{
            name: "excludedEmails",
            message: "Emails to exclude",
            type: "list"
        }]);
        logger.log("Got user input", userInput);
        this.userInput = userInput;

        await AdminCactusMemberService.getSharedInstance().getAllBatch({
            batchSize: 100, onData: async (members) => {
                const tasks = members.map(member => new Promise(async resolve => {
                    if (userInput.excludedEmails.includes(member.email as string)) {
                        logger.info(`Excluding ${ member.email }`);
                        resolve()
                        return
                    }
                    if (member.notificationSettings.email !== NotificationStatus.INACTIVE) {
                        member.notificationSettings.email = NotificationStatus.INACTIVE;
                        await AdminCactusMemberService.getSharedInstance().save(member);
                    }

                    resolve();
                    return
                }))

                await Promise.all(tasks);
                logger.info(`processed ${ tasks.length } members`)
                return;
            }
        })

        return;
    }
}