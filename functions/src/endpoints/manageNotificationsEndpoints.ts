import * as express from "express";
import * as cors from "cors";
import {getHostname} from "@api/config/configService";
import {PageRoute} from "@shared/PageRoutes";
import {QueryParam} from "@shared/util/queryParams";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import MailchimpService from "@admin/services/MailchimpService";
import {UpdateStatusRequest} from "@shared/mailchimp/models/UpdateStatusTypes";
import {ListMemberStatus} from "@shared/mailchimp/models/MailchimpTypes";
import chalk from "chalk";
import CactusMember from "@shared/models/CactusMember";
import AdminSlackService, {SlackAttachment, SlackAttachmentField} from "@admin/services/AdminSlackService";
import {getISODate} from "@shared/util/DateUtil";

const app = express();

// Automatically allow cross-origin requests
app.use(cors({origin: true}));


app.get("/manage-notifications/email/unsubscribe", async (req: express.Request, res: express.Response) => {
    const mailchimpId = req.query.mcuid;
    let email: string|undefined;

    if (!mailchimpId){
        const errorMessage = "The link you clicked was invalid or may have expired. Please try again.";
        res.redirect(`${getHostname()}${PageRoute.UNSUBSCRIBE_SUCCESS}?${QueryParam.MESSAGE}=${encodeURIComponent(errorMessage)}&${QueryParam.UNSUBSCRIBE_SUCCESS}=false`)
        return
    }

    //first, get via our system.
    if (mailchimpId) {
        const mailchimpMember = await AdminCactusMemberService.getSharedInstance().getByMailchimpUniqueEmailId(mailchimpId);
        email = mailchimpMember?.email;
    }

    //if we don't have an email still, try to fetch from mailchimp
    if (!email){
        const mailchimpListMember = await MailchimpService.getSharedInstance().getMemberByUniqueEmailId(mailchimpId);
        email = mailchimpListMember?.email_address;
    }

    if (!email){
        const errorMessage = "We were unable to find a member associated with the link you clicked.";
        res.redirect(`${getHostname()}${PageRoute.UNSUBSCRIBE_SUCCESS}?${QueryParam.MESSAGE}=${encodeURIComponent(errorMessage)}&${QueryParam.UNSUBSCRIBE_SUCCESS}=false`)
        return
    }

    console.log(`unsubscribing ${email} from mailchimp`);
    const statusRequest: UpdateStatusRequest = {
        status: ListMemberStatus.unsubscribed,
        email,
    };
    console.log(chalk.yellow("sending status request"), JSON.stringify(statusRequest, null, 2));
    // MailchimpService.getSharedInstance()
    const response = await MailchimpService.getSharedInstance().updateMemberStatus(statusRequest);
    let cactusMember: CactusMember | undefined = undefined;
    if (response.listMember) {
        cactusMember = await AdminCactusMemberService.getSharedInstance().updateFromMailchimpListMember(response.listMember);
        console.log("updated member after changing the status", cactusMember);
    }

    const attachments: SlackAttachment[] = [];
    const fields: SlackAttachmentField[] = [
        {
            title: "Email",
            value: statusRequest.email,
            short: false,
        },
        {
            title: "Reason Code",
            value: `Unsubscribed from an email`,
            short: false,
        },

        {
            title: "Cactus Member ID",
            value: (cactusMember ? cactusMember.id : "") || "not found",
            short: false,
        },
        {
            title: "Sign Up Date",
            value: (cactusMember && cactusMember.signupConfirmedAt) ? getISODate(cactusMember.signupConfirmedAt) : "Unknown"
        }
    ];

    attachments.push({
        title: `${statusRequest.email} ${statusRequest.status === ListMemberStatus.unsubscribed ? "Unsubscribed" : "Re-Subscribed"}`,
        fields: fields
    });

    const slackMessage = {
        text: `User Has manually ${statusRequest.status === ListMemberStatus.unsubscribed ? "Unsubscribed" : "Re-Subscribed"}`,
        attachments
    };

    await AdminSlackService.getSharedInstance().sendActivityMessage(slackMessage);


    if (response.success){
        res.status(302);
        const successMessage = "You have successfully unsubscribed";
        res.redirect(`${getHostname()}${PageRoute.UNSUBSCRIBE_SUCCESS}?${QueryParam.MESSAGE}=${encodeURIComponent(successMessage)}&${QueryParam.EMAIL}=${encodeURIComponent(email)}&${QueryParam.UNSUBSCRIBE_SUCCESS}=true`)
    } else {
        const errorMessage = `Something went wrong while unsubscribing you from our emails. \n${response.error?.message ? response.error.message : response.error}`.trim();
        res.redirect(`${getHostname()}${PageRoute.UNSUBSCRIBE_SUCCESS}?${QueryParam.MESSAGE}=${encodeURIComponent(errorMessage)}&${QueryParam.EMAIL}=${encodeURIComponent(email)}&${QueryParam.UNSUBSCRIBE_SUCCESS}=false`)
    }
});

export default app