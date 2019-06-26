import * as express from "express";
import * as cors from "cors";
import * as Stripe from "stripe";
import {getConfig} from "@api/config/configService";
import {CreateSessionRequest, CreateSessionResponse} from "@shared/api/CheckoutTypes";
import chalk from "chalk";
import {CheckoutSessionCompleted, PaymentIntent} from "@shared/types/StripeTypes";
import ICustomerUpdateOptions = Stripe.customers.ICustomerUpdateOptions;
import {sendActivityNotification, SlackMessage} from "@api/slack/slack";
import {QueryParam} from "../../../web/src/scripts/queryParams";
import {URL} from "url";
const config = getConfig();

const stripe = new Stripe(config.stripe.secret_key);
const app = express();

// Automatically allow cross-origin requests
app.use(cors({origin: true}));

app.post("/webhooks/sessions/completed", async (req: express.Request, res: express.Response) => {
    try {
        const event = req.body as CheckoutSessionCompleted;
        const data = event.data.object;
        const customerId = data.customer;
        const paymentIntentId = data.payment_intent;
        const intent = await stripe.paymentIntents.retrieve(paymentIntentId) as PaymentIntent;

        if (intent && customerId) {
            const paymentMethodId = intent.payment_method;
            const updateData = {
                invoice_settings: {
                    default_payment_method: paymentMethodId,
                }
            } as ICustomerUpdateOptions;

            const updateResponse = await stripe.customers.update(customerId, updateData); //Force the update options to comply to typescript :(
            await sendActivityNotification(":moneybag: Successfully processed pre-order!");
            console.log("Update response", JSON.stringify(updateResponse, null, 2));
        } else {
            const msg:SlackMessage = {
                text: `:rotating_light: No customerId or payment intent found on payload. Unable to process payment webhook.\n*Event Payload:*\n\`\`\`${JSON.stringify(req.body, null, 2)}\`\`\``,
            };
            await sendActivityNotification(msg);
        }

        console.log(chalk.blue(JSON.stringify(data, null, 2)));
        return res.sendStatus(204);
    } catch (error) {
        const msg:SlackMessage = {
            text: `:rotating_light: Failed to process Stripe Payment Complete webhook event.\n\`${error}\`\n\`\`\`${JSON.stringify(req.body, null, 2)}\`\`\``,

        };
        await sendActivityNotification(msg);
        res.status(500);
        res.send("Unable to process session: " + error);
        return;
    }
});

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


        let chargeAmount:number|undefined|null = 499;
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
            } catch (error){
                console.error("failed to retrive the plan");
            }
        }
        else if (preOrder) {
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
            success: true, sessionId: session.id, amount: chargeAmount, productId,
        };

    } catch (error){
        console.error("failed to load stripe checkout", error);
        createResponse = {success: false, error: "Unable to load the checkout page"};
    }
    return res.send(createResponse);
});

export default app;