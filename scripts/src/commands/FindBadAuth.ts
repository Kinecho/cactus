import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {CactusConfig} from "@shared/CactusConfig";
import {Project} from "@scripts/config";
import UserRecord = admin.auth.UserRecord;
import {isBlank} from "@shared/util/StringUtil";
import {writeToFile} from "@scripts/util/FileUtil";
import {stringifyJSON} from "@shared/util/ObjectUtil";
import helpers from "@scripts/helpers";
import * as path from "path";
import chalk from "chalk";
import {exec} from "child_process";
import * as prompts from "prompts"

export default class FindBadAuth extends FirebaseCommand {
    name = "Find Bad Auth";
    description = "Get auth records with out email addresses";
    showInList = true;
    noEmailUsers: UserRecord[] = [];

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);

        let token = undefined;
        let pageResult = await admin.auth().listUsers(1000, token);
        token = pageResult.pageToken;
        let users = pageResult.users;
        await this.processUsers(users);
        let index = 1;
        while (pageResult && users.length > 0 && token) {
            console.log("Processing page", index);
            pageResult = await admin.auth().listUsers(1000, token);
            token = pageResult.pageToken;
            users = pageResult.users;
            await this.processUsers(users);
            index++;
        }


        const filePath = path.resolve(helpers.outputDir, `bad-users-${new Date().toISOString()}.json`);
        await writeToFile(filePath, stringifyJSON(this.noEmailUsers, 2));

        console.log(chalk.green(`Downloaded file to ${filePath}`));
        const doOpenResponse: { doOpen: boolean } = await prompts({
            type: "confirm",
            message: "Do you want to open this file on your computer?",
            name: "doOpen"
        });

        if (doOpenResponse.doOpen) {
            exec(`open ${filePath}`);
        }

        return;
    }

    async processUsers(users: UserRecord[]) {
        users.forEach(u => {
            let noEmail = !!u.providerData.find(p => {
                return isBlank(p.email)
            });
            if (noEmail) {
                this.noEmailUsers.push(u);
            }
        });

    }

}