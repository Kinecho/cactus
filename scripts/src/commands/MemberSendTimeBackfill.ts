import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {CactusConfig} from "@shared/CactusConfig";
import {Project} from "@scripts/config";
import * as prompts from "prompts";
import {isValidEmail} from "@shared/util/StringUtil";
import AdminCactusMemberService, {UpdateSendPromptUTCResult} from "@admin/services/AdminCactusMemberService";
import CactusMember from "@shared/models/CactusMember";

interface UserInput {
    email: string
}

interface TypeInput {
    type: "single" | "all"
}

export default class MemberSendTimeBackfill extends FirebaseCommand {
    name = "Member Send Time";
    description = "Ensure every member has the default values for the sent time fields";
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
        console.log("Backfilling all ");

        let totalProcessed = 0;
        let totalUpdated = 0;
        let totalSkipped = 0;
        await AdminCactusMemberService.getSharedInstance().getAllBatch({
            batchSize: 100,
            onData: async members => {
                const tasks = members.map(member => this.updateMemberJob(member));
                const results = await Promise.all(tasks);
                console.log(`Got ${results.length} results`);
                totalProcessed += members.length;
                results.forEach(r => {
                    totalUpdated += r.updated ? 1 : 0;
                    totalSkipped += r.updated ? 0 : 1;
                });
                return;
            }
        });

        console.log(`Processed ${totalProcessed} members`);
        console.log(`Updated ${totalUpdated} members`);
        console.log(`Skipped ${totalSkipped} members`);
        return;
    }

    async startSingleJob() {
        const userInput: UserInput = await prompts([
            {
                name: "email",
                message: "The email to backfill",
                type: "text",
                validate: (value: string) => isValidEmail(value.trim()) || "Please enter a valid email address",
                format: (value: string) => value.trim()
            }]);
        console.log("Got user input", userInput);
        this.userInput = userInput;

        const profile = await this.updateMemberTimezone(userInput.email);
        console.log("Updated profile is", profile);


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

    async updateMemberTimezone(email: string): Promise<UpdateSendPromptUTCResult | undefined> {
        const member = await AdminCactusMemberService.getSharedInstance().getMemberByEmail(email);
        if (!member) {
            return;
        }
        return await this.updateMemberJob(member)
    }

    async updateMemberJob(member: CactusMember) {
        console.log(`updating ${member.email}`);
        return await AdminCactusMemberService.getSharedInstance().updateMemberUTCSendPromptTime(member, {
            useDefault: true,
        });
    }

}