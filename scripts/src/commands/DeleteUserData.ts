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
import AdminReflectionResponseService from "@admin/services/AdminReflectionResponseService";
import AdminSlackService from "@admin/services/AdminSlackService";
import AdminSentPromptService from "@admin/services/AdminSentPromptService";
import MailchimpService from "@admin/services/MailchimpService";
import AdminEmailReplyService from "@admin/services/AdminEmailReplyService";

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
        const email = answers.email;

        const [member, user, firebaseUser] = await Promise.all([
            await AdminCactusMemberService.getSharedInstance().getMemberByEmail(answers.email),
            await AdminUserService.getSharedInstance().getByEmail(answers.email),
            await new Promise<admin.auth.UserRecord | undefined>(async resolve => {
                try {
                    const user = await (admin.auth().getUserByEmail(answers.email));
                    resolve(user);
                } catch (e) {
                    resolve(undefined);
                }
            })
        ]);

        let deleteTasks: Promise<any>[] = [];

        if (member) {
            console.log("Cactus Member ID", member.id);
            deleteTasks.push(AdminFirestoreService.getSharedInstance().deletePermanently(member));
        } else {
            console.log(chalk.yellow("No member found for email:", answers.email));
        }

        deleteTasks.push(AdminReflectionResponseService.getSharedInstance().deletePermanentlyForMember(member || {email}));
        deleteTasks.push(AdminSentPromptService.getSharedInstance().deletePermanentlyForMember(member || {email}));
        deleteTasks.push(AdminEmailReplyService.getSharedInstance().deletePermanentlyByEmail(email));

        let deletePendingUserTask = AdminPendingUserService.getSharedInstance().deleteForEmail(email);

        if (user) {
            console.log("Cactus User found");
            deleteTasks.push(AdminFirestoreService.getSharedInstance().deletePermanently(user))
        } else {
            console.log("No cactus user found");
        }

        if (firebaseUser) {
            console.log("Found Firebase Auth User");
            deleteTasks.push(admin.auth().deleteUser(firebaseUser.uid));
            console.log("Deleted from auth")
        } else {
            console.log("No auth user found");
        }

        let deleteResults = await Promise.all([deletePendingUserTask, ...deleteTasks]);
        console.log(`Finished deleted ${deleteResults.length} tasks`);

        const mailchimpResponse = await MailchimpService.getSharedInstance().deleteMemberPermanently(email);
        console.log("delete member mailchimp response", mailchimpResponse);

        await AdminSlackService.getSharedInstance().sendEngineeringMessage({
            text: `:ghost: Deleted All Member Data for ${email}`
        });

        return;
    }

}