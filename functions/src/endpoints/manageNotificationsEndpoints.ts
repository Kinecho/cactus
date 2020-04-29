import * as express from "express";
import * as cors from "cors";
import {getHostname} from "@admin/config/configService";
import {PageRoute} from "@shared/PageRoutes";
import {QueryParam} from "@shared/util/queryParams";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import MailchimpService from "@admin/services/MailchimpService";
import {ListMember, ListMemberStatus} from "@shared/mailchimp/models/MailchimpTypes";
import Logger from "@shared/Logger";
import { isString } from "@shared/util/ObjectUtil";

const logger = new Logger("manageNotificationsEndpoints");
const app = express();
// const config = getConfig();
// Automatically allow cross-origin requests

// TODO: This didn't setup the CORS with allowedOrigins because we
// expect this to get hit from HTML links in emails and stuff. Maybe we should still do it. Not sure
// Neil Poulin, 2020-01-08
app.use(cors({origin: true}));

app.get("/manage-notifications/email/unsubscribe", async (req: express.Request, res: express.Response) => {
    const mailchimpUniqueId = req.query.mcuid as string|undefined;
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
        res.redirect(`${getHostname()}${PageRoute.UNSUBSCRIBE_SUCCESS}?${QueryParam.MESSAGE}=${encodeURIComponent(errorMessage)}&${QueryParam.UNSUBSCRIBE_SUCCESS}=false`)
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
        res.redirect(`${getHostname()}${PageRoute.UNSUBSCRIBE_SUCCESS}?${QueryParam.MESSAGE}=${encodeURIComponent(errorMessage)}&${QueryParam.UNSUBSCRIBE_SUCCESS}=false`)
        return
    }

    if (!listMember) {
        listMember = await MailchimpService.getSharedInstance().getMemberByUniqueEmailId(mailchimpUniqueId);
    }

    logger.log("list member status", listMember?.status);

    const isUnsubscribed = listMember?.status === ListMemberStatus.unsubscribed;

    res.redirect(`${getHostname()}${PageRoute.UNSUBSCRIBE_SUCCESS}?${QueryParam.ALREADY_UNSUBSCRIBED}=${isUnsubscribed}&${QueryParam.EMAIL}=${encodeURIComponent(email)}&${QueryParam.MAILCHIMP_EMAIL_ID}=${encodeURIComponent(mailchimpUniqueId)}`)
    return;
});

export default app