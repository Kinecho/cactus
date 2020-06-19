import * as express from "express";
import * as cors from "cors";
import * as functions from "firebase-functions";
import { getConfig, getHostname } from "@admin/config/configService";
import { PageRoute } from "@shared/PageRoutes";
import { QueryParam } from "@shared/util/queryParams";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import MailchimpService from "@admin/services/MailchimpService";
import { ListMember, ListMemberStatus } from "@shared/mailchimp/models/MailchimpTypes";
import Logger from "@shared/Logger";
import { isString, stringifyJSON } from "@shared/util/ObjectUtil";
import SecurityService from "@api/SecurityService";

const logger = new Logger("manageNotificationsEndpoints");
const app = express();
// const config = getConfig();
// Automatically allow cross-origin requests

// TODO: This didn't setup the CORS with allowedOrigins because we
// expect this to get hit from HTML links in emails and stuff. Maybe we should still do it. Not sure
// Neil Poulin, 2020-01-08
app.use(cors({ origin: true }));

app.get("/manage-notifications/email/unsubscribe", async (req: express.Request, res: express.Response) => {
    const mailchimpUniqueId = req.query.mcuid as string | undefined;
    let email: string | undefined;
    let mailchimpFullId: string | undefined;
    let listMember: ListMember | undefined;
    // const audienceId = config.mailchimp.audience_id;
    // const mailchimpAccountId = '676af7cc149986aaec398daa7';
    // const mailchimpUrl = `https://app.us20.list-manage.com/unsubscribe?u=${mailchimpAccountId}&id=${audienceId}`;
    // res.status(301).redirect(mailchimpUrl);
    // return;

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
    return;
});


app.post("/sendgrid/webhook", async (req, resp) => {
    // logger.info("Sendgrid webhook Request body", stringifyJSON(req.body, 2));
    logger.info("Sendgrid webhook headers", stringifyJSON(req.headers, 2));
    try {

        const signature = req.header("x-twilio-email-event-webhook-signature")!;
        const timestamp = req.header("X-Twilio-Email-Event-Webhook-Signature")!;
        const rawBody = (req as functions.https.Request).rawBody;
        const config = getConfig()
        // crypto.

        // const verify = crypto.createVerify('SHA256');
        const payload: Buffer = Buffer.concat([Buffer.from(timestamp), rawBody]);
        // const payload = `${ timestamp }${ rawBody }`;
        // const verified = crypto.verify("sha256", payload, config.sendgrid.webhook_verification_key, new Buffer(signature));
        // verify.write(timestamp)
        // verify.write(rawBody);
        // verify.end();
        const key = config.sendgrid.webhook_verification_key

        // logger.info("rawBody");
        logger.info(rawBody);
        // logger.info("raw body to string", rawBody.toString("utf8"));
        // const verified = verify.verify(config.sendgrid.webhook_verification_key, decodedSignature)
        const verified = await SecurityService.shared.nodeVerify(payload, timestamp, signature, key)
        logger.info("Sendgrid key verified", verified);
        if (!verified) {
            resp.sendStatus(403);
            return
        }

        // const hash = crypto.createHmac('sha256', ).update(base).digest('hex');
        resp.send(204);
    } catch (error) {
        logger.error("Failed to process webhook", error);
        resp.status(500).send(error);
        return;
    }
})

export default app