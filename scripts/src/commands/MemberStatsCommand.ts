import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {CactusConfig} from "@shared/CactusConfig";
import * as prompts from "prompts"
import {Project} from "@scripts/config";
import {isValidEmail} from "@shared/util/StringUtil";
import AdminReflectionResponseService from "@admin/services/AdminReflectionResponseService";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import chalk from "chalk";

interface UserInput {
    email: string
}

export default class MemberStatsCommand extends FirebaseCommand {
    name = "Member Stats";
    description = "Get Member Stats";
    showInList = true;

    response!: UserInput;

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);

        await this.getStats();

        return;
    }

    async getStats(): Promise<void> {
        const response: UserInput = await prompts([{
            message: "Member Email",
            name: "email",
            validate: (input: string) => isValidEmail(input) || "Please enter a valid email",
            format: (input: string) => input.toLowerCase().trim(),
            type: "text"
        }]);
        this.response = response;

        const member = await AdminCactusMemberService.getSharedInstance().getMemberByEmail(response.email);
        if (!member) {
            console.error(chalk.red(`No cactus member was found for email: ${response.email}`));
            return;
        }
        const memberId = member.id;
        if (!memberId) {
            console.error(chalk.red(`No memberId was found on the cactus member with email: ${response.email}`));
            return;
        }

        const timeZone = member.timeZone || undefined;
        const stats = await AdminReflectionResponseService.getSharedInstance().calculateStatsForMember({
            memberId,
            timeZone
        });

        console.log(chalk.blue(`Stats for ${response.email}:\n ${JSON.stringify(stats, null, 2)}`));

        if (stats) {
            const saveResponse = await prompts({
                name: "save",
                message: "Save these stats to the member?",
                type: "confirm"
            });

            if (saveResponse.save) {
                await AdminCactusMemberService.getSharedInstance().setStats({memberId, stats: stats});
                console.log("successfully saved the member")
            }
        }

        const redoResponse = await prompts({
            name: "doAnother",
            type: "confirm",
            message: "Do you want to get stats for another member?"
        });

        if (redoResponse.doAnother) {
            await this.getStats();
        }
        return;
    }

}