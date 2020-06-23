import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {CactusConfig} from "@admin/CactusConfig";
import {Project} from "@scripts/config";
import UserRecord = admin.auth.UserRecord;
import {isBlank} from "@shared/util/StringUtil";
import {writeToFile} from "@scripts/util/FileUtil";
import {isDate, stringifyJSON} from "@shared/util/ObjectUtil";
import helpers from "@scripts/helpers";
import * as path from "path";
import chalk from "chalk";
import {exec} from "child_process";
import * as prompts from "prompts"
import {transactionalOnCreate} from "@admin/AuthUserCreateJob";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";

export default class FindBadAuth extends FirebaseCommand {
    name = "Find Bad Auth";
    description = "Get auth records with out email addresses";
    showInList = true;
    noEmailUsers: UserRecord[] = [];

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);

        let token = undefined;
        let pageResult = await app.auth().listUsers(1000, token);
        token = pageResult.pageToken;
        let users = pageResult.users;
        await this.findBadAuthUsers(users);
        let index = 1;
        while (pageResult && users.length > 0 && token) {
            console.log("Processing page", index);
            pageResult = await app.auth().listUsers(1000, token);
            token = pageResult.pageToken;
            users = pageResult.users;
            await this.findBadAuthUsers(users);
            index++;
        }

        console.log("Number of users found", this.noEmailUsers.length);
        const filePath = path.resolve(helpers.outputDir, `bad-users-${new Date().toISOString()}.json`);
        await writeToFile(filePath, stringifyJSON(this.noEmailUsers, 2));

        for (const user of this.noEmailUsers) {
            // console.log("user", user);
            const signupDate = !isBlank(user.metadata.creationTime) ? new Date(user.metadata.creationTime) : undefined;
            console.log("user created at", signupDate);
            console.log("user created date is date", isDate(signupDate));
            await transactionalOnCreate(user, true);
            const foundMember = await AdminCactusMemberService.getSharedInstance().getById(user.uid);
            if (foundMember) {
                console.log("Created user with email", foundMember.email, ". Updating admin claims so they don't get reprocessed");
                await app.auth().setCustomUserClaims(user.uid, {processedNoEmailBackfill: true});
            }
        }

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

    async findBadAuthUsers(users: UserRecord[]) {
        const tasks = users.map(u => {
            return new Promise(async resolve => {
                if (!u.email) {
                    console.log("User with no email UID = ", u.uid, `backfill claim = ${(u.customClaims as any | undefined)?.processedNoEmailBackfill}`);
                    if (!(u.customClaims as any | undefined)?.processedNoEmailBackfill) {
                        console.log("\talso doesn't have claims");
                        this.noEmailUsers.push(u);
                    } else {
                        console.log(`Skipping user ${u.uid} - has already been processed.`);
                        // await this.app.auth().setCustomUserClaims(u.uid, {processedNoEmailBackfill: false})
                    }
                }
                resolve();
            })
        });
        await Promise.all(tasks);
    }
}