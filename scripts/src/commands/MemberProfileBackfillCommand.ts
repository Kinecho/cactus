import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {CactusConfig} from "@shared/CactusConfig";
import {Project} from "@scripts/config";
import prompts from "prompts";
import {isValidEmail} from "@shared/util/StringUtil";
import MemberProfile from "@shared/models/MemberProfile";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import AdminMemberProfileService from "@admin/services/AdminMemberProfileService";
import UserRecord = admin.auth.UserRecord;
import CactusMember from "@shared/models/CactusMember";

interface UserInput {
    email: string
}

interface TypeInput {
    type: "single" | "all"
}

export default class MemberProfileBackfillCommand extends FirebaseCommand {
    name = "Member Profile Backfill Command";
    description = "Create member profiles for every member";
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
        await AdminCactusMemberService.getSharedInstance().getAllBatch({
            batchSize: 100,
            onData: async members => {
                const tasks = members.map(member => this.updateMemberJob(member));
                const results = await Promise.all(tasks);
                console.log(`Got ${results.length} results`);
                totalProcessed += members.length;
                return;
            }
        });

        console.log(`Processed ${totalProcessed} members`);

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


        const profile = await this.updateMemberProfile(userInput.email);
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

    async updateMemberProfile(email: string): Promise<MemberProfile | undefined> {
        const member = await AdminCactusMemberService.getSharedInstance().getMemberByEmail(email);
        if (!member) {
            return;
        }
        return await this.updateMemberJob(member)
    }

    async updateMemberJob(member: CactusMember): Promise<MemberProfile | undefined> {
        const userId = member.userId;
        let userRecord: UserRecord | undefined = undefined;
        if (userId) {
            userRecord = await this.app.auth().getUser(userId)
        }
        console.log(`updating ${member.email}`);
        return await AdminMemberProfileService.getSharedInstance().upsertMember({member, userRecord})
    }

}