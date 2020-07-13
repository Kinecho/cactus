import { FirebaseCommand } from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import { CactusConfig } from "@admin/CactusConfig";
import { Project } from "@scripts/config";
import * as prompts from "prompts";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import AdminRevenueCatService from "@admin/services/AdminRevenueCatService";
import CactusMember from "@shared/models/CactusMember";
import SubscriptionProduct from "@shared/models/SubscriptionProduct";
import AdminSubscriptionProductService from "@admin/services/AdminSubscriptionProductService";
import AdminPaymentService from "@admin/services/AdminPaymentService";
import Logger from "@shared/Logger"

const logger = new Logger("RevenueCatTest");


interface UserInput {
    email: string,
    jobType: RevenueCatType,
}

enum RevenueCatType {
    syncStripeSubscription = "Sync Stripe Subscription",
    syncAllForMember = "Sync All For Member",
    updateSubscriberAttributes = "Update Subscriber Attributes",
    migrateApplePayments = "Migrate Apple Payments",
    migrateGooglePayments = "Migrate Google Payments",
    migrateStripePayments = "Migrate Stripe Payments",

}

const MemberRequiredTypes: RevenueCatType[] = [
    RevenueCatType.syncStripeSubscription,
    RevenueCatType.updateSubscriberAttributes,
    RevenueCatType.syncAllForMember
];

export default class RevenueCatTest extends FirebaseCommand {
    name = "Revenue Cat Test";
    description = "Test different stuff with revenuecat";
    showInList = true;
    userInput!: UserInput;

    productsById: Record<string, SubscriptionProduct> = {};

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);

        await this.begin();

        return;
    }

    async begin() {
        const userInput: UserInput = await prompts([
            {
                name: "jobType",
                message: "What type of job do you want to run?",
                type: "select",
                choices: Object.values(RevenueCatType as any).map((v: any) => ({ title: v, value: v })),
            }, {
                name: "email",
                message: "User Email",
                type: (prev: RevenueCatType) => MemberRequiredTypes.includes(prev) ? "text" : null,
                initial: this.userInput?.email ?? "",
            }]);
        console.log("Got user input", userInput);
        this.userInput = userInput;

        const jobType = userInput.jobType;
        const member = await AdminCactusMemberService.getSharedInstance().getMemberByEmail(this.userInput.email);
        if (MemberRequiredTypes.includes(jobType) && !(member && member.id)) {
            console.log("No member found for email and a member is required", userInput?.email);
            await this.askRunAgain();
            return;
        }
        console.log("running job", jobType);
        switch (jobType) {
            case RevenueCatType.syncStripeSubscription:
                await this.updateStripeSubscription(member!);
                break;
            case RevenueCatType.updateSubscriberAttributes:
                await this.updateSubscriberAttributes(member!);
                break;
            case RevenueCatType.migrateApplePayments:
                await this.migrateApplePayments();
                break;
            case RevenueCatType.migrateGooglePayments:
                await this.migrateGooglePayments();
                break;
            case RevenueCatType.migrateStripePayments:
                await this.migrateStripePayments();
                break;
            case RevenueCatType.syncAllForMember:
                await this.migrateAllForMember(member!);
                break;
        }

        await this.askRunAgain();
    }

    async migrateAllForMember(member: CactusMember) {
        const payments = await AdminPaymentService.getSharedInstance().getAllForMemberId(member?.id);
        logger.info(`Processing ${ payments.length } payments`);
        await AdminRevenueCatService.shared.processPayments(payments);
        logger.info(`Finished processing ${ payments.length } payments`);
        return;
    }

    async fetchCactusProducts() {
        const products = await AdminSubscriptionProductService.getSharedInstance().getAll();
        products.forEach(p => {
            this.productsById[p.entryId] = p;
        });
        return this.productsById;
    }

    async migrateApplePayments() {
        const productsById = await this.fetchCactusProducts();
        console.log(`Got ${ Object.values(productsById).length } subscription products`);
        await AdminPaymentService.getSharedInstance().getAllAppleTransactionsBatch({
            batchSize: 10,
            onData: async (payments, batchNumber) => {
                logger.info("\nStarting processing batch", batchNumber);
                const tasks = payments.map(payment => AdminRevenueCatService.shared.processApplePayment(payment));
                logger.info("Finished processing batch", batchNumber);
                await Promise.all(tasks);
            }
        })
    }

    async migrateStripePayments() {
        const productsById = await this.fetchCactusProducts();
        console.log(`Got ${ Object.values(productsById).length } subscription products`);
        await AdminPaymentService.getSharedInstance().getAllStripeTransactionsBatch({
            batchSize: 10,
            onData: async (payments, batchNumber) => {
                logger.info("\nprocessing batch ", batchNumber);
                const tasks: Promise<void>[] = payments.map(payment => AdminRevenueCatService.shared.processStripePayment(payment));
                await Promise.all(tasks);
                logger.info("Finished batch", batchNumber);
                return;
            }
        })

    }

    async migrateGooglePayments() {
        const productsById = await this.fetchCactusProducts();
        console.log(`Got ${ Object.values(productsById).length } subscription products`);
        await AdminPaymentService.getSharedInstance().getAllGoogleTransactionsBatch({
            batchSize: 10,
            onData: async (payments, batchNumber) => {
                logger.info("\nprocessing batch ", batchNumber);
                const tasks = payments.map(payment => AdminRevenueCatService.shared.processGooglePayment(payment))
                logger.info("Finished batch", batchNumber);
                await Promise.all(tasks);
            }
        })
    }

    async updateStripeSubscription(member: CactusMember): Promise<void> {
        const memberId = member.id!;

        const stripeSubscriptionId = member.subscription?.stripeSubscriptionId;
        if (!stripeSubscriptionId) {
            console.log("No stripe subscription id found");
            return;
        }

        await AdminRevenueCatService.shared.updateStripeSubscription({ memberId, subscriptionId: stripeSubscriptionId });
    }

    async updateSubscriberAttributes(member: CactusMember) {
        await AdminRevenueCatService.shared.updateSubscriberAttributes(member)
    }

    async askRunAgain() {
        const result: { runAgain: boolean } = await prompts({
            message: "Run again",
            name: "runAgain",
            type: "confirm",
        })

        if (result.runAgain) {
            await this.begin();
        } else {
            return;
        }
    }
}