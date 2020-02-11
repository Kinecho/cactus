import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {CactusConfig} from "@shared/CactusConfig";
import {Project} from "@scripts/config";
import * as prompts from "prompts";
import {isValidEmail} from "@shared/util/StringUtil";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import CactusMember from "@shared/models/CactusMember";
import {getValidTimezoneName} from "@shared/timezones";
import chalk from "chalk";
interface UserInput {
    email: string
}

interface TypeInput {
    type: "single" | "all"
}

interface MemberResult {
    updated: boolean,
    originalTimeZone?: string,
    updatedTimeZone?: string,
}

export default class MemberSendTimeBackfill extends FirebaseCommand {
    name = "Update Member Timezones";
    description = "Ensure every member has a valid timezone ";
    showInList = true;
    useAdmin = true;
    userInput!: UserInput;

    // admin!: admin.app.App;
    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        // this.admin = admin;
        console.log("Using project", project);

        const typeInput: TypeInput = await prompts([
            {
                name: "type",
                message: "Run single or all",
                type: "select",
                choices: [{value: "single", title: "One at a time"}, {value: "all", title: "EVERYONE"}]
            }]);

        if (typeInput.type === "single") {
            await this.startSingleJob();
        } else if (typeInput.type === "all") {
            await this.startAllJob();
        }

        return;
    }

    async startAllJob(): Promise<void> {
        console.log("updating all members");

        let totalProcessed = 0;
        let totalUpdated = 0;
        let totalSkipped = 0;
        const badTimezones = new Set<string>();
        await AdminCactusMemberService.getSharedInstance().getAllBatch({
            batchSize: 500,
            onData: async members => {
                const tasks = members.map(member => this.updateMemberJob(member));
                const results = await Promise.all(tasks);
                console.log(`Got ${results.length} results`);
                totalProcessed += members.length;

                results.forEach(r => {
                    totalUpdated += r.updated ? 1 : 0;
                    totalSkipped += r.updated ? 0 : 1;
                    if (r.updated && r.originalTimeZone) {
                        badTimezones.add(r.originalTimeZone);
                    }
                });
                return;
            }
        });

        console.log();
        console.log(chalk.green(`Processed ${totalProcessed} members`));
        console.log(chalk.green(`Updated ${totalUpdated} members`));
        console.log(chalk.green(`Skipped ${totalSkipped} members`));
        console.log(chalk.green(`${badTimezones.size} Bad timezones updated: ${JSON.stringify(Array.from(badTimezones))}`));
        return;
    }

    async startSingleJob() {
        const userInput: UserInput = await prompts([
            {
                name: "email",
                message: "Member Email",
                type: "text",
                validate: (value: string) => isValidEmail(value.trim()) || "Please enter a valid email address",
                format: (value: string) => value.trim()
            }]);
        console.log("Got user input", userInput);
        this.userInput = userInput;

        const memberResult = await this.updateMemberTimezone(userInput.email);
        console.log("Updated result is", memberResult);


        const repeatInput = await prompts({
            name: "again",
            message: "Do you want to do another?",
            type: "confirm"
        });

        if (repeatInput.again) {
            await this.startSingleJob()
        } else {
            return;
        }
    }

    async updateMemberTimezone(email: string): Promise<MemberResult | undefined> {
        const member = await AdminCactusMemberService.getSharedInstance().getMemberByEmail(email);
        if (!member) {
            return;
        }
        return await this.updateMemberJob(member)
    }

    async updateMemberJob(member: CactusMember): Promise<MemberResult> {
        // console.log(`updating ${member.email}`);
        const memberTz = member.timeZone;
        if (!memberTz) {
            return {updated: false, originalTimeZone: undefined}
        }
        const validTz = getValidTimezoneName(memberTz);
        if (validTz === memberTz) {
            return {updated: false, originalTimeZone: memberTz, updatedTimeZone: validTz}
        }
        if (validTz !== memberTz) {
            console.log(chalk.blue(`Updating ${member.email}'s timezone from '${memberTz}' to '${validTz}'`));
            await AdminCactusMemberService.getSharedInstance().saveTimeZone(member, validTz);
            return {updated: true, originalTimeZone: memberTz, updatedTimeZone: validTz}
        }
        return {updated: false, originalTimeZone: memberTz, updatedTimeZone: validTz}
    }
}