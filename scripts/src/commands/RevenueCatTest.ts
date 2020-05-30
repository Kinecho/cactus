import { FirebaseCommand } from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import { CactusConfig } from "@shared/CactusConfig";
import { Project } from "@scripts/config";
import * as prompts from "prompts";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import RevenueCatService from "@admin/services/RevenueCatService";
import CactusMember from "@shared/models/CactusMember";
import SubscriptionProduct from "@shared/models/SubscriptionProduct";
import AdminSubscriptionProductService from "@admin/services/AdminSubscriptionProductService";
import AdminPaymentService from "@admin/services/AdminPaymentService";
import Logger from "@shared/Logger"
import { getStripeId } from "@admin/util/AdminStripeUtils";

const logger = new Logger("RevenueCatTest");


interface UserInput {
    email: string,
    jobType: RevenueCatType,
}

enum RevenueCatType {
    syncStripeSubscription = "Sync Stripe Subscription",
    updateSubscriberAttributes = "Update Subscriber Attributes",
    migrateApplePayments = "Migrate Apple Payments",
    migrateGooglePayments = "Migrate Google Payments",
    migrateStripePayments = "Migrate Stripe Payments",
}

const MemberRequiredTypes: RevenueCatType[] = [RevenueCatType.syncStripeSubscription, RevenueCatType.updateSubscriberAttributes];

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
                choices: Object.values(RevenueCatType).map(v => ({ title: v, value: v })),
            }, {
                name: "email",
                message: "User Email",
                type: (prev) => MemberRequiredTypes.includes(prev as RevenueCatType) ? "text" : null,
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
                await this.updateStripSubscription(member!);
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
        }

        await this.askRunAgain();
    }

    async fetchCactusProducts() {
        const products = await AdminSubscriptionProductService.getSharedInstance().getAll();
        products.forEach(p => {
            this.productsById[p.entryId!] = p;
        });
        return this.productsById;
    }

    async migrateApplePayments() {
        const productsById = await this.fetchCactusProducts();
        console.log(`Got ${ Object.values(productsById).length } subscription products`);
        await AdminPaymentService.getSharedInstance().getAllAppleTransactionsBatch({
            onData: async (payments, batchNumber) => {
                //hello;
                logger.info("processing batch ", batchNumber);
                const tasks = payments.map(payment => new Promise(async resolve => {
                    console.log("Processing payment", payment.id);
                    const memberId = payment.memberId;
                    const cactusProductId = payment.subscriptionProductId;
                    const product = cactusProductId ? productsById[cactusProductId] : undefined;
                    const price = payment.apple?.productPrice?.price ?? ((product?.priceCentsUsd ?? 0) / 100);
                    const priceLocale = payment.apple?.productPrice?.priceLocale;
                    let currency = "USD";
                    if (priceLocale?.includes("@currency=")) {
                        currency = priceLocale.split("@currency=")[1];
                    }
                    // const appleProductId = payment.apple?.unifiedReceipt?.latest_receipt_info
                    const appleProductId = product?.appleProductId;

                    const encodedReceipt = payment.apple?.raw?.latest_receipt;
                    if (!encodedReceipt) {
                        resolve();
                        return;
                    }

                    logger.info(`updating apple subscription for memberId: ${ memberId } in revenuecat: price: ${ price } | currency: ${ currency }`);
                    await RevenueCatService.shared.updateAppleSubscription({
                        memberId,
                        encodedReceipt,
                        price,
                        currency,
                        productId: appleProductId
                    })
                    const member = await AdminCactusMemberService.getSharedInstance().getById(memberId);
                    if (member) {
                        logger.info("Updating the member attributes in revenuecat");
                        await this.updateSubscriberAttributes(member);
                    }
                    resolve()
                }))
                await Promise.all(tasks);
            }
        })
    }

    async migrateStripePayments() {
        const productsById = await this.fetchCactusProducts();
        console.log(`Got ${ Object.values(productsById).length } subscription products`);
        await AdminPaymentService.getSharedInstance().getAllStripeTransactionsBatch({
            batchSize: 100,
            onData: async (payments, batchNumber) => {
                //hello;
                logger.info("\nprocessing batch ", batchNumber);
                const tasks = payments.map(payment => new Promise(async resolve => {
                    console.log("Processing payment", payment.id);
                    const memberId = payment.memberId;
                    // const cactusProductId = payment.subscriptionProductId;
                    // const product = cactusProductId ? productsById[cactusProductId] : undefined;
                    const stripeSubscriptionId = getStripeId(payment.stripe?.checkoutSession?.subscription);
                    if (!stripeSubscriptionId) {
                        logger.info("Not processing member as there is no stripe subscription id", memberId);
                        resolve();
                        return;
                    }

                    const member = await AdminCactusMemberService.getSharedInstance().getById(memberId);
                    logger.info(`updating stripe subscription for memberId: ${ memberId } | email: ${ member?.email ?? "" } in revenuecat with subscriptionId ${ stripeSubscriptionId }`);
                    await RevenueCatService.shared.updateStripeSubscription({
                        memberId,
                        subscriptionId: stripeSubscriptionId,
                        // sku,
                    })

                    if (member) {
                        logger.info("Updating the member attributes in revenuecat");
                        await this.updateSubscriberAttributes(member);
                    }
                    logger.info("Finished processing member", memberId);
                    resolve()
                }))
                logger.info("Finished batch", batchNumber);
                await Promise.all(tasks);
            }
        })

    }

    async migrateGooglePayments() {
        const productsById = await this.fetchCactusProducts();
        console.log(`Got ${ Object.values(productsById).length } subscription products`);
        await AdminPaymentService.getSharedInstance().getAllGoogleTransactionsBatch({
            batchSize: 100,
            onData: async (payments, batchNumber) => {
                //hello;
                logger.info("\nprocessing batch ", batchNumber);
                const tasks = payments.map(payment => new Promise(async resolve => {
                    console.log("Processing payment", payment.id);
                    const memberId = payment.memberId;
                    const cactusProductId = payment.subscriptionProductId;
                    const product = cactusProductId ? productsById[cactusProductId] : undefined;
                    const token = payment.google?.token;
                    if (!token) {
                        logger.info("Not processing member as there is no token", memberId);
                        resolve();
                        return;
                    }

                    const sku = payment.google?.subscriptionProductId ?? product?.androidProductId;
                    if (!sku) {
                        logger.info(`Not processing member ${ memberId } as no SKU was found. PaymentID = ${ payment.id }`);
                        resolve();
                        return;
                    }
                    const member = await AdminCactusMemberService.getSharedInstance().getById(memberId);
                    logger.info(`updating Android subscription for memberId: ${ memberId } | email: ${ member?.email ?? "" } in revenuecat with sku: ${ sku }`);
                    await RevenueCatService.shared.updateGoogleSubscription({
                        memberId,
                        token,
                        sku,
                    })

                    if (member) {
                        logger.info("Updating the member attributes in revenuecat");
                        await this.updateSubscriberAttributes(member);
                    }
                    logger.info("Finished processing member", memberId);
                    resolve()
                }))
                logger.info("Finished batch", batchNumber);
                await Promise.all(tasks);
            }
        })
    }

    async updateStripSubscription(member: CactusMember): Promise<void> {
        const memberId = member.id!;

        const stripeSubscriptionId = member.subscription?.stripeSubscriptionId;
        if (!stripeSubscriptionId) {
            console.log("No stripe subscription id found");
            return;
        }

        await RevenueCatService.shared.updateStripeSubscription({ memberId, subscriptionId: stripeSubscriptionId });
    }

    async updateSubscriberAttributes(member: CactusMember) {
        const memberId = member.id!;
        const email = member.email;
        const name = member.getFullName();
        await RevenueCatService.shared.updateAttributes({ memberId: memberId, email, name });
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