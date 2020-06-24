import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {Project} from "@scripts/config";
import {CactusConfig} from "@admin/CactusConfig";
import {isValidEmail} from "@shared/util/StringUtil";
import * as chalk from "chalk";

const prompts = require("prompts");

export default class UserUpdatePhotoURLCommand extends FirebaseCommand {
    name = "User Update Photo URL Command";
    description = "Update a user's photo url";
    showInList = true;
    useAdmin = true;

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);

        const promptResponses: { email: string, photoURL: string } = await prompts([{
            name: "email",
            message: "User Email",
            type: "text",
            format: (value: string) => value.trim().toLowerCase(),
            validate: (value: string) => isValidEmail(value) || "Please enter a valid email"
        },
            {
                name: "photoURL",
                message: "Photo URL",
                type: "text",
            }
        ]);


        // const user = await app.auth().getUserByEmail(promptResponses.email);
        const user = await app.auth().getUserByEmail(promptResponses.email);
        if (!user) {
            console.error("No user found for email", promptResponses.email);
            return;
        }

        const updatedUser = await app.auth().updateUser(user.uid, {photoURL: promptResponses.photoURL});

        console.log("Updated user");
        console.log(chalk.yellow(JSON.stringify(updatedUser.toJSON())));

        return;
    }

}