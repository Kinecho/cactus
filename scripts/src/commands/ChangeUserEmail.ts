import { FirebaseCommand } from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import { CactusConfig } from "@shared/CactusConfig";
import { Project } from "@scripts/config";
import * as prompts from "prompts";
import { stringifyJSON } from "@shared/util/ObjectUtil";
import Logger from "@shared/Logger"
import chalk from "chalk";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import UserRecord = admin.auth.UserRecord;

const logger = new Logger("ChangeUserEmail");


interface UserInput {
    oldEmail: string,
    newEmail: string,
}

export default class ChangeUserEmail extends FirebaseCommand {
    name = "Change User Email";
    description = "Change a user's email";
    showInList = true;
    userInput!: UserInput;
    useAdmin = true;

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);

        await this.go();
        return;
    }

    async go() {
        await this.beginChange();
        await this.goAgain();
    }

    async beginChange() {
        const userInput: UserInput = await prompts([{
            name: "oldEmail",
            message: "Current Email",
            type: "text"
        }, {
            name: "newEmail",
            message: "New Email",
            type: "text",
        }]);
        console.log("Got user input", stringifyJSON(userInput, 2));
        this.userInput = userInput;

        try {
            const user = await this.app.auth().getUserByEmail(userInput.oldEmail);
            if (!user) {
                logger.info("No user record was found");
                return;
            }

            logger.info(`Got user ${ user.uid } - ${ user.email } | email Verified = ${ user.emailVerified }`)
            logger.info(user.toJSON());

            try {
                const existingNewEmail = await this.app.auth().getUserByEmail(userInput.newEmail)
                if (existingNewEmail) {
                    logger.warn(chalk.red(`A user already exists (${ existingNewEmail.uid }) for desired email address: ${ userInput.newEmail }`));
                    return;
                }
            } catch (error) {
                logger.info("No user found with requested email, continuing");
            }

            await this.changeEmail(user, userInput.newEmail);

            const updatedUser = await this.app.auth().getUserByEmail(userInput.newEmail)
            if (updatedUser) {
                logger.info(chalk.green(`updated user is\n${ stringifyJSON(updatedUser.toJSON(), 2) }`))
            } else {
                logger.warn("Can not find updated user in the auth service");
            }
        } catch (error) {
            logger.error("Failed to find a user with email", error);
        }
    }

    async changeEmail(user: UserRecord, newEmail: string) {
        try {
            await this.app.auth().updateUser(user.uid, { email: newEmail });
            logger.info("changed user's email to ", newEmail);
            logger.info("Updating member profile");
            const member = await AdminCactusMemberService.getSharedInstance().getMemberByUserId(user.uid);
            const memberId = member?.id;
            if (!memberId) {
                logger.warn("No member id found on cactus member");
                return;
            }
            await AdminCactusMemberService.getSharedInstance().setEmail(memberId, newEmail);
        } catch (error) {
            logger.error("Failed to change user's email", error);
        }

    }

    async goAgain() {
        const again: { confirm: boolean } = await prompts({
            type: "confirm",
            name: "confirm",
            message: "Run Again",
        })
        if (again.confirm) {
            await this.go();
        }
        return;
    }

}