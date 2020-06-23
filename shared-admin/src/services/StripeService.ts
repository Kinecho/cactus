import { CactusConfig } from "@admin/CactusConfig";
import Stripe from "stripe";
import Logger from "@shared/Logger";

import {
    convertPaymentMethod,
    getInvoiceStatusFromStripeStatus,
    getStripeId,
    isStripePaymentMethod,
    subscriptionStatusFromStripeInvoice
} from "@admin/util/AdminStripeUtils";
import { isString, stringifyJSON } from "@shared/util/ObjectUtil";
import { PaymentMethod, SubscriptionInvoice } from "@shared/models/SubscriptionTypes";
import { BillingPlatform } from "@shared/models/MemberSubscription";
import CactusMember from "@shared/models/CactusMember";

export default class StripeService {
    protected static sharedInstance: StripeService;

    config: CactusConfig;
    logger = new Logger("StripeService");
    stripe: Stripe;

    static getSharedInstance(): StripeService {
        if (!StripeService.sharedInstance) {
            throw new Error("No shared instance available. Ensure you initialize StripeService before using it");
        }
        return StripeService.sharedInstance;
    }

    static initialize(config: CactusConfig) {
        StripeService.sharedInstance = new StripeService(config);
    }

    constructor(config: CactusConfig) {
        this.config = config;
        this.stripe = new Stripe(config.stripe.secret_key, {
            apiVersion: '2019-12-03',
        });
    }


    async fetchStripeSetupIntent(setupIntentId?: string): Promise<Stripe.SetupIntent | undefined> {
        if (!setupIntentId) {
            return;
        }

        try {
            return await this.stripe.setupIntents.retrieve(setupIntentId);
        } catch (error) {
            this.logger.error(`Failed to fetch setup intent with id ${ setupIntentId }`);
            return;
        }
    }

    async fetchStripePlan(planId?: string): Promise<Stripe.Plan | undefined> {
        if (!planId) {
            return undefined;
        }
        try {
            return await this.stripe.plans.retrieve(planId);
        } catch (error) {
            this.logger.error(`failed to retrieve the plan from stripe with Id: ${ planId }`);
            return;
        }
    }

    async createStripeCustomer(member: CactusMember): Promise<Stripe.Customer> {
        const memberId = member.id ?? "";
        const customer = await this.stripe.customers.create({
            email: member.email,
            name: member.getFullName(),
            metadata: {
                "memberId": memberId,
                "userId": member.userId ?? "",
            }
        });
        this.logger.info(`Successfully created stripe customer ${ customer.id } for cactus member ${ member.email }`);
        return customer
    }

    async getStripeCustomer(customerId: string, expand?: string[]): Promise<Stripe.Customer | undefined> {
        try {
            const customer = await this.stripe.customers.retrieve(customerId, { expand });
            if ((customer as Stripe.DeletedCustomer).deleted) {
                return undefined;
            }
            return customer as Stripe.Customer;
        } catch (error) {
            this.logger.error(`Failed to get the stripe customer for customerId = ${ customerId }`, error);
            return undefined;
        }
    }

    async updateStripeCustomer(customerId: string, settings: Stripe.CustomerUpdateParams): Promise<Stripe.Customer | undefined> {
        try {
            return await this.stripe.customers.update(customerId, settings);
        } catch (error) {
            this.logger.error(`Failed to update stripe customer ${ customerId }`, error);
            return;
        }
    }

    async updateStripeSubscriptionDefaultPaymentMethod(subscriptionId: string, paymentMethodId: string): Promise<Stripe.Subscription | undefined> {
        try {
            return await this.stripe.subscriptions.update(subscriptionId, {
                default_payment_method: paymentMethodId,
            })
        } catch (error) {
            this.logger.error(`Failed to update the default payment method in subscription ${ subscriptionId }`, error);
            return;
        }
    }

    async getDefaultStripeSourceId(customerId: string): Promise<string | undefined> {
        const customer = await this.getStripeCustomer(customerId);
        if (!customer) {
            return undefined;
        }
        if (isString(customer.default_source)) {
            return customer.default_source;
        }
        return undefined;
    }

    async getDefaultStripeInvoicePaymentMethod(customerId: string): Promise<PaymentMethod | undefined> {
        const customer = await this.getStripeCustomer(customerId, ["invoice_settings.default_payment_method"]);
        if (!customer) {
            return undefined;
        }
        const paymentMethod = customer.invoice_settings?.default_payment_method;
        if (isStripePaymentMethod(paymentMethod)) {
            return convertPaymentMethod(paymentMethod);
        } else {
            this.logger.warn(`Unable to build payment method from invoice_settings.default_payment_method ${ JSON.stringify(paymentMethod, null, 2) }`);
        }
        return;
    }

    async getStripePaymentMethod(paymentMethodId?: string): Promise<Stripe.PaymentMethod | undefined> {
        if (!paymentMethodId) {
            return;
        }
        try {
            return await this.stripe.paymentMethods.retrieve(paymentMethodId);
        } catch (error) {
            this.logger.error("Unable to fetch payment method with id ", paymentMethodId);
            return;
        }
    }

    async getStripeSubscription(subscriptionId?: string): Promise<Stripe.Subscription | undefined> {
        if (!subscriptionId) {
            return undefined;
        }

        try {
            const subscription = await this.stripe.subscriptions.retrieve(subscriptionId, { expand: ["default_payment_method"] });
            this.logger.info("retrieved striped subscription", stringifyJSON(subscription, 2));
            return subscription
        } catch (error) {
            this.logger.error("Failed to fetch stripe subscription with id", subscriptionId)
            return undefined;
        }
    }

    async getDefaultPaymentMethodFromStripeInvoice(invoice: Stripe.Invoice): Promise<Stripe.PaymentMethod | undefined> {
        const stripeCustomerId: string | null = isString(invoice.customer) ? invoice.customer : invoice.customer.id;
        if (isStripePaymentMethod(invoice.default_payment_method)) {
            return invoice.default_payment_method
        }
        const subscription = isString(invoice.subscription) ? await this.getStripeSubscription(invoice.subscription) : invoice.subscription;
        const subPaymentMethod = subscription?.default_payment_method;
        if (isStripePaymentMethod(subPaymentMethod)) {
            return subPaymentMethod;
        }
        const subPaymentMethodId = getStripeId(subPaymentMethod);
        if (subPaymentMethodId) {
            return await this.getStripePaymentMethod(subPaymentMethodId);
        }
        if (stripeCustomerId) {
            this.logger.info("attempting to fetch customer's default payment method");
            const customer = await this.getStripeCustomer(stripeCustomerId, ["invoice_settings.default_payment_method"]);
            const invoiceSettingsPaymentMethod = customer?.invoice_settings?.default_payment_method;
            if (isStripePaymentMethod(invoiceSettingsPaymentMethod)) {
                return invoiceSettingsPaymentMethod;
            }
        }
        return;
    }

    async getUpcomingStripeInvoice(options: { customerId?: string, subscriptionId?: string }): Promise<SubscriptionInvoice | undefined> {
        const { customerId: stripeCustomerId, subscriptionId: stripeSubscriptionId } = options;
        if (!stripeCustomerId && !stripeSubscriptionId) {
            this.logger.warn("No stripeCustomerId or stripeSubscriptionId found on the member. Can not fetch subscription details.");
            return undefined;
        }
        try {
            const stripeInvoice = await this.stripe.invoices.retrieveUpcoming({
                customer: stripeCustomerId,
                subscription: stripeSubscriptionId,
                expand: ["default_payment_method", "subscription.default_payment_method"]
            });
            if (!stripeInvoice) {
                this.logger.info("No upcoming invoices found.");
                return undefined;
            }

            const stripeSubscription = stripeInvoice.subscription as Stripe.Subscription | undefined;

            const stripePaymentMethod = await this.getDefaultPaymentMethodFromStripeInvoice(stripeInvoice);
            const invoice: SubscriptionInvoice = {
                invoiceStatus: getInvoiceStatusFromStripeStatus(stripeInvoice.status),
                amountCentsUsd: stripeInvoice.total,
                defaultPaymentMethod: convertPaymentMethod(stripePaymentMethod),
                periodStart_epoch_seconds: stripeInvoice.period_start,
                periodEnd_epoch_seconds: stripeInvoice.period_end,
                nextPaymentDate_epoch_seconds: stripeInvoice.next_payment_attempt || undefined,
                paid: stripeInvoice.paid,
                stripeInvoiceId: stripeInvoice.id,
                stripeSubscriptionId: getStripeId(stripeInvoice.subscription),
                isAppleSubscription: false,
                isGoogleSubscription: false,
                isAutoRenew: stripeInvoice.auto_advance ?? true,
                billingPlatform: BillingPlatform.STRIPE,
                subscriptionStatus: subscriptionStatusFromStripeInvoice(stripeInvoice),
                optOutTrialStartsAt_epoch_seconds: stripeSubscription?.trial_start || undefined,
                optOutTrialEndsAt_epoch_seconds: stripeSubscription?.trial_end || undefined,
            };
            this.logger.info("Built invoice object", stringifyJSON(invoice, 2));
            return invoice;

        } catch (error) {
            this.logger.warn(`No upcoming invoice found for| customerId ${ stripeCustomerId } | stripeSubscriptionId ${ stripeSubscriptionId }`);
            return undefined;
        }
    }

    async cancelSubscriptionImmediately(subscriptionId: string): Promise<Stripe.Subscription> {
        return await this.stripe.subscriptions.del(subscriptionId);
    }

    async cancelAtPeriodEnd(subscriptionId: string): Promise<Stripe.Subscription> {
        return await this.stripe.subscriptions.update(subscriptionId, {cancel_at_period_end: true});
    }
}
