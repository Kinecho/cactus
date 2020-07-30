import * as express from "express";
import * as cors from "cors";
import * as Sentry from "@sentry/node";
import { getConfig, getHostname } from "@admin/config/configService";
import { PageRoute } from "@shared/PageRoutes";
import { QueryParam } from "@shared/util/queryParams";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import MailchimpService from "@admin/services/MailchimpService";
import { ListMember, ListMemberStatus } from "@shared/mailchimp/models/MailchimpTypes";
import Logger from "@shared/Logger";
import { isString, stringifyJSON } from "@shared/util/ObjectUtil";
import CryptoService from "@api/CryptoService";
import * as functions from "firebase-functions";
import AdminSendgridService from "@admin/services/AdminSendgridService";
import { SendgridWebhookEvent } from "@admin/services/SendgridServiceTypes";
import { SentryExpressHanderConfig } from "@api/util/RequestUtil";

const logger = new Logger("manageNotificationsEndpoints");
const app = express();

app.use(Sentry.Handlers.requestHandler(SentryExpressHanderConfig) as express.RequestHandler);


// app.use(bodyParser.text({ type: 'application/json' }))
// TODO: This didn't setup the CORS with allowedOrigins because we
// expect this to get hit from HTML links in emails and stuff. Maybe we should still do it. Not sure
// Neil Poulin, 2020-01-08
app.use(cors({ origin: true }));

app.get("/manage-notifications/email/unsubscribe", async (req: express.Request, res: express.Response) => {
    try {
        const mailchimpUniqueId = req.query.mcuid as string | undefined;
        let email: string | undefined;
        let mailchimpFullId: string | undefined;
        let listMember: ListMember | undefined;

        if (!mailchimpUniqueId) {
            const errorMessage = "The link you clicked was invalid or may have expired. Please try again.";
            res.redirect(`${ getHostname() }${ PageRoute.UNSUBSCRIBE_SUCCESS }?${ QueryParam.MESSAGE }=${ encodeURIComponent(errorMessage) }&${ QueryParam.UNSUBSCRIBE_SUCCESS }=false`)
            return
        }

        //first, get via our system.
        if (isString(mailchimpUniqueId)) {
            const cactusMember = await AdminCactusMemberService.getSharedInstance().getByMailchimpUniqueEmailId(mailchimpUniqueId);
            email = cactusMember?.email;
            mailchimpFullId = cactusMember?.mailchimpListMember?.id;
        }

        //if we don't have an email still, try to fetch from mailchimp
        if (!email || !mailchimpFullId) {
            listMember = await MailchimpService.getSharedInstance().getMemberByUniqueEmailId(mailchimpUniqueId);
            email = listMember?.email_address;
            mailchimpFullId = listMember?.id
        }


        logger.log("mailchimpFullId", mailchimpFullId);
        logger.log("mailchimp unique id", mailchimpUniqueId);


        if (!email) {
            const errorMessage = "We were unable to find a member associated with the link you clicked.";
            res.redirect(`${ getHostname() }${ PageRoute.UNSUBSCRIBE_SUCCESS }?${ QueryParam.MESSAGE }=${ encodeURIComponent(errorMessage) }&${ QueryParam.UNSUBSCRIBE_SUCCESS }=false`)
            return
        }

        if (!listMember) {
            listMember = await MailchimpService.getSharedInstance().getMemberByUniqueEmailId(mailchimpUniqueId);
        }

        logger.log("list member status", listMember?.status);

        const isUnsubscribed = listMember?.status === ListMemberStatus.unsubscribed;

        res.redirect(`${ getHostname() }${ PageRoute.UNSUBSCRIBE_SUCCESS }?${ QueryParam.ALREADY_UNSUBSCRIBED }=${ isUnsubscribed }&${ QueryParam.EMAIL }=${ encodeURIComponent(email) }&${ QueryParam.MAILCHIMP_EMAIL_ID }=${ encodeURIComponent(mailchimpUniqueId) }`)
    } catch (error) {
        logger.error(error)
        res.status(500).send({error: error.message})
    }
});


app.post("/sendgrid/webhook", async (req, resp) => {
    try {
        const signature = req.header("x-twilio-email-event-webhook-signature")!;
        const timestamp = req.header("X-Twilio-Email-Event-Webhook-Timestamp")!;
        logger.info("signature", signature);
        logger.info("timestamp", timestamp);
        const key = getConfig().sendgrid.webhook_verification_key
        const bodyPayload = (req as functions.https.Request).rawBody.toString();
        const verified = await CryptoService.shared.verifySendgrid(bodyPayload, timestamp, signature, key)
        logger.info("Sendgrid key verified", verified);
        if (!verified) {
            resp.sendStatus(403);
            return
        }

        const events = req.body as SendgridWebhookEvent[];
        const allTasks = events.map(event => AdminSendgridService.getSharedInstance().handleWebhookEvent(event))
        const results = await Promise.all(allTasks);
        logger.info("Processed all events", stringifyJSON(results, 2));

        resp.send(204);
    } catch (error) {
        logger.error(error);
        resp.status(500).send(error);
        return;
    }
})

app.use(Sentry.Handlers.errorHandler() as express.ErrorRequestHandler);

export default app