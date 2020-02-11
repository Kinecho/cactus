
import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {CactusConfig} from "@shared/CactusConfig";
import {Project} from "@scripts/config";
import prompts from "prompts";
import {isValidEmail} from "@shared/util/StringUtil";
import chalk from "chalk";
import {Collection} from "@shared/FirestoreBaseModels";
import UserRecord = admin.auth.UserRecord;


export default class SetAdminClaimsCommand extends FirebaseCommand {
    name = "User: Set Admin Claims";
    description = "Set admin claims in firebase auth";
    showInList = true;
    admin = true;

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);

        console.log();
        const userResponse: { emails: string[], confirm: boolean } = await prompts([{
            message: "Email(s) of users. Separate by comma",
            name: "emails",
            type: "list",
            validate: (input: any) => {
                let emails: string[] = [];
                if (Array.isArray(input)) {
                    emails = input;
                } else {
                    emails = input.split(",");
                }
                const invalid: string[] = [];
                const isValid = emails.reduce((valid, email: string) => {
                    const emailValid = isValidEmail(email.trim());
                    if (!emailValid) {
                        invalid.push(email);
                    }
                    return valid && emailValid
                }, true);
                return isValid || `The following emails are not valid: ${invalid.join(', ')}`;
            },
            format: (emails: string[]) => emails.map(email => email.trim().toLowerCase())
        }, {
            type: "confirm",
            message: emails => `Are you sure you want to add ${emails.join(", ")} as admin(s)?`,
            name: "confirm",
        }]);

        if (!userResponse.confirm) {
            console.log("Not adding any admin permissions");
            process.exit(0);
            return;
        }

        for (const email of userResponse.emails) {
            try {
                const user = await app.auth().getUserByEmail(email);
                await this.addAdminClaims(user);
            } catch (error) {
                console.error(chalk.red(`No user found for email ${email}`));
            }
        }


        return;
    }

    async addAdminClaims(user: UserRecord, isAdmin: boolean = true): Promise<void> {

        const userId = user.uid;
        const currentClaims = user.customClaims;
        let updatedClaims = {admin: isAdmin};
        if (currentClaims) {
            console.log(`${user.email} has custom claims:`, JSON.stringify(currentClaims, null, 2))
            updatedClaims = {...currentClaims, ...updatedClaims};
        } else {
            console.log(`${user.email} does not currently have any custom claims`);
        }

        if (this.app) {
            console.log(`Setting ${user.email}'s claims to `, JSON.stringify(updatedClaims, null, 2));
            await this.app.auth().setCustomUserClaims(userId, updatedClaims);
            const ref = AdminFirestoreService.getSharedInstance().getCollectionRef(Collection.users).doc(userId);
            await ref.update({isAdmin, claims: updatedClaims});


            console.log(chalk.green(`Successfully updated the ${user.email}'s claims. They will take effect the next time a new id token is issued (likely next time they log in)`))
        } else {
            throw new Error("No app was found on the command instance. Can not update claims.");
        }

        return;
    }


}