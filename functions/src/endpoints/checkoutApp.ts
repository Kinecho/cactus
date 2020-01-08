import * as express from "express";
import * as cors from "cors";
import * as Stripe from "stripe";
import {getConfig} from "@admin/config/configService";
import {CreateSessionRequest, CreateSessionResponse} from "@shared/api/CheckoutTypes";
import chalk from "chalk";
import {QueryParam} from "@shared/util/queryParams";
import {URL} from "url";
import MailchimpService from "@admin/services/MailchimpService";
import {JournalStatus} from "@shared/models/CactusMember";
import {MergeField, TagName, TagStatus} from "@shared/mailchimp/models/MailchimpTypes";
import AdminSlackService, {
    ChatMessage,
    SlackAttachment,
    SlackAttachmentField,
    SlackMessage
} from "@admin/services/AdminSlackService";
import ICustomerUpdateOptions = Stripe.customers.ICustomerUpdateOptions;
import ICheckoutSession = Stripe.checkouts.sessions.ICheckoutSession;
import IPaymentIntent = Stripe.paymentIntents.IPaymentIntent;

const config = getConfig();

const stripe = new Stripe(config.stripe.secret_key);
const app = express();

// Automatically allow cross-origin requests
app.use(cors({origin: config.allowedOrigins}));

app.post("/webhooks/sessions/completed", async (req: express.Request, res: express.Response) => {
    // const mailchimpService = MailchimpService.getSharedInstance();
    const slackService = AdminSlackService.getSharedInstance();
    try {
        const event = req.body as Stripe.events.IEvent;
        const data = event.data.object as Stripe.checkouts.sessions.ICheckoutSession;

        // Handle the pre-order use case. This can probably be deleted.
        const paymentIntent = data.payment_intent;
        if (paymentIntent) {
            console.log("Handing payment intent");
            const intentResult = await handlePaymentIntent(paymentIntent, data);
            if (intentResult.error) {
                console.log("error processing payment intent", intentResult.error);
            }
            res.sendStatus(intentResult.statusCode)
            return
        } else {
            const [firstItem] = data.display_items;
            const attachments: SlackAttachment[] = [];
            const fields: SlackAttachmentField[] = [];

            const customerEmail = data.customer_email || "unknown";
            if (firstItem) {
                fields.push({title: "Amount", value: (firstItem.amount / 100).toFixed(2), short: true});
                const item = firstItem as any;
                if (item.plan) {
                    const subItem = item as Stripe.subscriptionItems.ISubscriptionItem;
                    if (subItem.plan.interval) {
                        fields.push({title: "Interval", value: subItem.plan.interval, short: true});
                    }
                    if (subItem.plan.nickname) {
                        fields.push({title: "Plan", value: subItem.plan.nickname});
                    }

                }

            }
            attachments.push({fields});
            const message: ChatMessage = {
                text: `:moneybag: ${customerEmail} completed a purchase!`,
                attachments,
            };
            await AdminSlackService.getSharedInstance().sendActivityMessage(message)
        }


        console.log(chalk.blue(JSON.stringify(data, null, 2)));
        return res.sendStatus(204);
    } catch (error) {
        const msg: SlackMessage = {
            text: `:rotating_light: Failed to process Stripe Payment Complete webhook event.\n\`${error}\`\n\`\`\`${JSON.stringify(req.body, null, 2)}\`\`\``,

        };
        await slackService.sendActivityNotification(msg);
        res.status(500);
        res.send("Unable to process session: " + error);
        return;
    }
});

interface PaymentIntentResult {
    error?: any;
    statusCode: number;
}

async function handlePaymentIntent(paymentIntent: string | IPaymentIntent, data: ICheckoutSession): Promise<PaymentIntentResult> {
    try {
        // const data = event.data.object;
        let customerId: string | undefined;
        if (typeof data.customer === "string") {
            customerId = data.customer
        } else {
            customerId = data.customer?.id
        }

        let paymentIntentId: string;
        if (typeof paymentIntent === "string") {
            paymentIntentId = paymentIntent
        } else {
            paymentIntentId = paymentIntent.id
        }


        let email = data.customer_email;
        const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
        const slackService = AdminSlackService.getSharedInstance();
        if (intent && customerId) {
            const paymentMethodId = intent.payment_method;
            const updateData = {
                invoice_settings: {
                    default_payment_method: paymentMethodId,
                }
            } as ICustomerUpdateOptions;

            const updateResponse = await stripe.customers.update(customerId, updateData); //Force the update options to comply to typescript :(
            email = updateResponse.email;

            //Notify slack that payment was successful
            await slackService.sendActivityNotification(`:moneybag: Successfully processed pre-order for ${email}!`);

            //Update mailchimp member, if they exist, if not, send scary slack message
            const mailchimpMember = await MailchimpService.getSharedInstance().getMemberByEmail(email);
            console.log("Mailchimp member", mailchimpMember);
            if (email && mailchimpMember) {
                const tagUpdateResponse = await MailchimpService.getSharedInstance().updateTags({
                    tags: [{
                        name: TagName.JOURNAL_PREMIUM,
                        status: TagStatus.ACTIVE
                    }], email
                });
                if (!tagUpdateResponse.success) {
                    await slackService.sendActivityNotification(`:rotating-light: Failed to add tag ${TagName.JOURNAL_PREMIUM} to Mailchimp member ${email}\nError: \`${tagUpdateResponse.error ? tagUpdateResponse.error.title : tagUpdateResponse.unknownError}\``);
                }

                const mergeFieldUpdateResponse = await MailchimpService.getSharedInstance().updateMergeFields({
                    mergeFields: {JNL_STATUS: JournalStatus.PREMIUM},
                    email
                });
                if (!mergeFieldUpdateResponse.success) {
                    await slackService.sendActivityNotification(`:rotating-light: Failed update merge field ${MergeField.JNL_STATUS} to ${TagName.JOURNAL_PREMIUM} for Mailchimp member ${email}\nError: \`${mergeFieldUpdateResponse.error ? mergeFieldUpdateResponse.error.title : mergeFieldUpdateResponse.unknownError}\``);
                }

            } else {
                await slackService.sendActivityNotification(`:warning: ${email} is not subscribed to mailchimp list`);
            }

            console.log("Update response", JSON.stringify(updateResponse, null, 2));

            return {statusCode: 204, error: undefined}
        } else {
            const msg: SlackMessage = {
                text: `:rotating_light: No customerId or payment intent found on payload. Unable to process payment webhook.\n*Event Payload:*\n\`\`\`${JSON.stringify(data, null, 2)}\`\`\``,
            };
            await slackService.sendActivityNotification(msg);
            return {statusCode: 204, error: undefined}
        }
    } catch (error) {
        const msg: SlackMessage = {
            text: `:rotating_light: Failed to process Stripe Payment Complete webhook event.\n\`${error}\`\n\`\`\`${JSON.stringify(data, null, 2)}\`\`\``,

        };
        await AdminSlackService.getSharedInstance().sendActivityNotification(msg);

        return {
            statusCode: 500,
            error: error
        };
    }
}

/**
 * Get a session ID for stripe checkout
 *
 * Note: Unlike sessions created via the Client integration,
 * sessions created via the Server integration do not support creating subscriptions with trial_period_days set at the Plan level.
 * To set a trial period, please pass the desired trial length as the value of the subscription_data.trial_period_days argument.
 */
app.post("/sessions", async (req: express.Request, res: express.Response) => {
    let createResponse: CreateSessionResponse;

    try {
        res.contentType("application/json");

        const sessionRequest = req.body as CreateSessionRequest;


        console.log(chalk.yellow("request body", JSON.stringify(sessionRequest, null, 2)));

        // const isPreorder = req.params
        const successUrl = sessionRequest.successUrl || "https://cactus.app/success";
        const cancelUrl = sessionRequest.cancelUrl || "https://cactus.app";
        const preOrder = sessionRequest.preOrder || false;
        const planId = sessionRequest.planId;
        const items = sessionRequest.items;


        const stripeOptions: any = {
            payment_method_types: ['card'],
            success_url: successUrl,
            cancel_url: cancelUrl,
        };


        if (items && items.length > 0) {
            stripeOptions.line_items = items;
        }


        let chargeAmount: number | undefined | null = 499;
        let productId = planId;
        if (planId) {
            stripeOptions.subscription_data = {
                items: [{
                    plan: planId
                }]
            };

            try {
                const plan = await stripe.plans.retrieve(planId);
                chargeAmount = plan.amount;
            } catch (error) {
                console.error("failed to retrive the plan");
            }
        } else if (preOrder) {
            productId = 'Cactus Journal';
            stripeOptions.payment_intent_data = {
                capture_method: 'manual',
            };

            stripeOptions.line_items = [{
                name: "Cactus Journal",
                currency: 'USD',
                amount: chargeAmount,
                description: "You will be billed monthly. Pause or cancel anytime.",
                quantity: 1,
            }];
        }

        const updatedSuccess = new URL(stripeOptions.success_url);
        updatedSuccess.searchParams.set(QueryParam.PURCHASE_AMOUNT, `${chargeAmount}`);
        updatedSuccess.searchParams.set(QueryParam.PURCHASE_ITEM_ID, `${productId}`);


        console.log(chalk.blue("success url is", updatedSuccess.toString()))
        stripeOptions.success_url = updatedSuccess.toString();


        console.log("Stripe Checkout Options", JSON.stringify(stripeOptions, null, 2));
        // @ts-ignore
        const session = await stripe.checkout.sessions.create(stripeOptions);

        createResponse = {
            success: true,
            sessionId: session.id,
            amount: chargeAmount,
            productId,
        };

    } catch (error) {
        console.error("failed to load stripe checkout", error);
        createResponse = {success: false, error: "Unable to load the checkout page"};
    }
    return res.send(createResponse);
});

export default app;