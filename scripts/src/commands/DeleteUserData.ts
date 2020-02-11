import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {CactusConfig} from "@shared/CactusConfig";
import {Project} from "@scripts/config"
import * as prompts from "prompts"
import {isValidEmail} from "@shared/util/StringUtil";
import chalk from "chalk";
import AdminUserService from "@admin/services/AdminUserService";
import {stringifyJSON} from "@shared/util/ObjectUtil";

export default class DeleteUserData extends FirebaseCommand {
    name = "Delete User Data";
    description = "Deletes all data associated with a user from the data base. This action is non-reversable.";
    showInList = true;
    useAdmin = true;

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);

        const answers: { email: string, confirm: boolean } = await prompts([
            {
                message: "What is the email of the user you want to delete?",
                type: "text",
                validate: (value: string) => isValidEmail(value) ? true : "Please enter a valid email",
                name: "email",
                format: (e: string) => e.trim().toLowerCase(),
            },
            {
                message: "Are you sure you want to delete all of their data from the database? This action is non-reversable",
                type: "confirm",
                name: "confirm",
            }]);

        if (!answers.confirm) {
            console.log("Not deleting anything.");
            return;
        } else {
            console.log(chalk.red(`Deleting all data for ${answers.email}`));
        }
        const email = answers.email;

        const results = await AdminUserService.getSharedInstance().deleteAllDataPermanently({email, adminApp: app});
        console.log(stringifyJSON(results, 2));
    }
}