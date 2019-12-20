import * as express from "express";
import * as cors from "cors";
import {getHostname} from "@admin/config/configService";
import {PageRoute} from "@shared/PageRoutes";
import {QueryParam} from "@shared/util/queryParams";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import MailchimpService from "@admin/services/MailchimpService";
import {ListMember, ListMemberStatus} from "@shared/mailchimp/models/MailchimpTypes";

const app = express();
// const config = getConfig();
// Automatically allow cross-origin requests
app.use(cors({origin: true}));


app.get("/manage-notifications/email/unsubscribe", async (req: express.Request, res: express.Response) => {
    const mailchimpUniqueId = req.query.mcuid;
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
    if (mailchimpUniqueId) {
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


    console.log("mailchimpFullId", mailchimpFullId);
    console.log("mailchimp unique id", mailchimpUniqueId);


    if (!email) {
        const errorMessage = "We were unable to find a member associated with the link you clicked.";
        res.redirect(`${getHostname()}${PageRoute.UNSUBSCRIBE_SUCCESS}?${QueryParam.MESSAGE}=${encodeURIComponent(errorMessage)}&${QueryParam.UNSUBSCRIBE_SUCCESS}=false`)
        return
    }

    if (!listMember) {
        listMember = await MailchimpService.getSharedInstance().getMemberByUniqueEmailId(mailchimpUniqueId);
    }

    console.log("list member status", listMember?.status);

    const isUnsubscribed = listMember?.status === ListMemberStatus.unsubscribed;

    res.redirect(`${getHostname()}${PageRoute.UNSUBSCRIBE_SUCCESS}?${QueryParam.ALREADY_UNSUBSCRIBED}=${isUnsubscribed}&${QueryParam.EMAIL}=${encodeURIComponent(email)}&${QueryParam.MAILCHIMP_EMAIL_ID}=${encodeURIComponent(mailchimpUniqueId)}`)
    return;
});

export default app