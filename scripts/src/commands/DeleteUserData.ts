import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {CactusConfig} from "@shared/CactusConfig";
import {Project} from "@scripts/config"
import * as prompts from "prompts"
import {isValidEmail} from "@shared/util/StringUtil";
import chalk from "chalk";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import AdminPendingUserService from "@admin/services/AdminPendingUserService";
import AdminUserService from "@admin/services/AdminUserService";

export default class DeleteUserData extends FirebaseCommand {
    name = "Delete User Data";
    description = "Deletes all data associated with a user from the data base. This action is non-reversable.";
    showInList = true;

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);

        const answers: { email: string, confirm: boolean } = await prompts([
            {
                message: "What is the email of the user you want to delete?",
                type: "text",
                validate: (value: string) => isValidEmail(value) ? true : "Please enter a valid email",
                name: "email",
                format: (email: string) => email.trim().toLowerCase(),
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

        const [member, pendingUser, user, firebaseUser] = await Promise.all([
            await AdminCactusMemberService.getSharedInstance().getMemberByEmail(answers.email),
            await AdminPendingUserService.getSharedInstance().getPendingByEmail(answers.email),
            await AdminUserService.getSharedInstance().getByEmail(answers.email),
            await new Promise<admin.auth.UserRecord|undefined>(async resolve => {
                try {
                    const user = await (admin.auth().getUserByEmail(answers.email));
                    resolve(user);
                } catch (e) {
                    resolve(undefined);
                }
            })
        ]);

        if (!member) {
            console.log(chalk.yellow("No member found for email:", answers.email));
        } else {
            console.log("Cactus Member ID", member.id);
        }

        if (pendingUser) {
            console.log("Pending User found")
        } else {
            console.log("No pending user found")
        }

        if (user) {
            console.log("Cactus User found");
        } else {
            console.log("No cactus user found");
        }

        if (firebaseUser) {
            console.log("Found Firebase Auth User")
        } else {
            console.log("No auth user found");
        }

        return;
    }

}