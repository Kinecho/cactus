import { FirebaseCommand } from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import { CactusConfig } from "@shared/CactusConfig";
import { Project } from "@scripts/config";
import * as prompts from "prompts";
import Logger from "@shared/Logger"
import { Store } from "@shared/api/RevenueCatApi";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import CactusMember from "@shared/models/CactusMember";
import chalk from "chalk";
import { stringifyJSON } from "@shared/util/ObjectUtil";
import { AndroidFulfillRestoredPurchasesParams, AndroidPurchaseHistoryRecord } from "@shared/api/CheckoutTypes";
import AdminSubscriptionService from "@admin/services/AdminSubscriptionService";
import { isValidEmail } from "@shared/util/StringUtil";

const logger = new Logger("RestorePurchases");

interface UserInput {
    emailOrUserId: string,
    store: Store,
}

interface AndroidAnswers {
    token: string,
    packageName: string,
    androidProductSku: string,
    purchaseTime: number,
}

export default class RestorePurchases extends FirebaseCommand {
    name = "Restore Purchases";
    description = "Tools for restoring purchases for users";
    showInList = true;
    androidAnswers?: AndroidAnswers;
    userInput!: UserInput;
    member!: CactusMember;

    get androidPackageName(): string {
        return this.project === Project.PROD ? "app.cactus" : "app.cactus.stage";
    }

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);


        await this.doJob()
        return;
    }

    async doJob() {
        try {
            await this.processUserInput()
        } catch (error) {
            logger.error("Unexpected error doing job", error);
        }

        await this.runAgain()
    }

    async processUserInput() {
        const userInput: UserInput = await prompts([
            {
                name: "emailOrUserId",
                message: "Member Email or ID",
                type: "text",
                initial: this.userInput?.emailOrUserId ?? ""
            },
            {
                name: "store",
                message: "Which App Store?",
                type: "select",
                choices: [
                    { title: "Android", value: Store.PLAY_STORE },
                    { title: "Apple", value: Store.APP_STORE },
                    { title: "Stripe", value: Store.STRIPE, disabled: true }
                ]
            }]);
        console.log("Got user input", userInput);
        this.userInput = userInput;

        let member: CactusMember | undefined;
        if (isValidEmail(userInput.emailOrUserId)) {
            logger.info("Getting member by email");
            member = await AdminCactusMemberService.getSharedInstance().getMemberByEmail(userInput.emailOrUserId);
        } else {
            logger.info("Getting member by userId");
            member = await AdminCactusMemberService.getSharedInstance().getById(userInput.emailOrUserId);
        }

        if (!member) {
            logger.info(chalk.red(`No member found for userId or email ${ userInput.emailOrUserId }. Can not continue`));
            return;
        } else {
            logger.info(`Found member ${ member.email } | UserId = ${ member.id } | tier = ${ member.tier }`);
        }

        this.member = member;

        switch (userInput.store) {
            case Store.PLAY_STORE:
                await this.handleAndroid();
                break;
            case Store.APP_STORE:
            case Store.STRIPE:
            case Store.MAC_APP_STORE:
            case Store.PROMOTIONAL:
            default:
                logger.info(`Store ${ userInput.store } is not supported.`);
                break;
        }
    }

    async handleAndroid() {
        const androidAnswers: AndroidAnswers = await prompts([{
            name: "token",
            message: "Android Token",
            type: "text",
            initial: this.androidAnswers?.token ?? ""
        }, {
            name: "androidProductSku",
            type: "text",
            message: "Android Product SKU",
            initial: this.androidAnswers?.androidProductSku ?? ""
        }, {
            name: "packageName",
            message: "Android Package Name",
            type: "text",
            initial: this.androidAnswers?.packageName ?? this.androidPackageName,
        }, {
            name: "purchaseTime",
            message: "Purchase Time (epoch ms, like 1591128970882)",
            type: "number",
        }])

        logger.info(`Got android answers ${ stringifyJSON(androidAnswers, 2) }`);
        this.androidAnswers = androidAnswers;

        const purchaseRecord: AndroidPurchaseHistoryRecord = {
            token: androidAnswers.token,
            packageName: androidAnswers.packageName,
            subscriptionProductId: androidAnswers.androidProductSku,
            purchaseTime: androidAnswers.purchaseTime,
        }

        const params: AndroidFulfillRestoredPurchasesParams = {
            restoredPurchases: [purchaseRecord],
        }

        logger.info("Submitting android record to restore purchase");
        const restoreResult = await AdminSubscriptionService.getSharedInstance().fulfillRestoredAndroidPurchases(this.member, params);
        logger.info(chalk.green(`Fulfill result:\n${ stringifyJSON(restoreResult, 2) }`));
    }

    async runAgain() {
        const againResponse = await prompts({
            type: "confirm",
            name: "again",
            message: "Run again?",
        })

        if (againResponse.again) {
            await this.doJob();
            return;
        }
        return;
    }

}