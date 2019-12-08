import * as express from "express";
import * as cors from "cors";
import {getConfig} from "@api/config/configService";

const app = express();
const config = getConfig();
// Automatically allow cross-origin requests
app.use(cors({origin: true}));


app.get("/manage-notifications/email/unsubscribe", async (req: express.Request, res: express.Response) => {
    // const mailchimpUniqueId = req.query.mcuid;
    // let email: string|undefined;
    // let mailchimpFullId: string|undefined;
    const audienceId = config.mailchimp.audience_id;
    const mailchimpAccountId = '676af7cc149986aaec398daa7';
    const mailchimpUrl = `https://app.us20.list-manage.com/unsubscribe?u=${mailchimpAccountId}&id=${audienceId}`;
    res.status(301).redirect(mailchimpUrl);
    return;

    // if (!mailchimpUniqueId){
    //     const errorMessage = "The link you clicked was invalid or may have expired. Please try again.";
    //     res.redirect(`${getHostname()}${PageRoute.UNSUBSCRIBE_SUCCESS}?${QueryParam.MESSAGE}=${encodeURIComponent(errorMessage)}&${QueryParam.UNSUBSCRIBE_SUCCESS}=false`)
    //     return
    // }
    //
    // //first, get via our system.
    // if (mailchimpUniqueId) {
    //     const mailchimpMember = await AdminCactusMemberService.getSharedInstance().getByMailchimpUniqueEmailId(mailchimpUniqueId);
    //     email = mailchimpMember?.email;
    //     mailchimpFullId = mailchimpMember?.mailchimpListMember?.id;
    // }
    //
    // //if we don't have an email still, try to fetch from mailchimp
    // if (!email || !mailchimpFullId){
    //     const mailchimpListMember = await MailchimpService.getSharedInstance().getMemberByUniqueEmailId(mailchimpUniqueId);
    //     email = mailchimpListMember?.email_address;
    //     mailchimpFullId = mailchimpListMember?.id
    // }
    //
    // console.log("mailchimpFullId", mailchimpFullId);
    // console.log("mailchimp unique id", mailchimpUniqueId);
    //
    //
    // if (!email){
    //     const errorMessage = "We were unable to find a member associated with the link you clicked.";
    //     res.redirect(`${getHostname()}${PageRoute.UNSUBSCRIBE_SUCCESS}?${QueryParam.MESSAGE}=${encodeURIComponent(errorMessage)}&${QueryParam.UNSUBSCRIBE_SUCCESS}=false`)
    //     return
    // }
    //
    // console.log(`unsubscribing ${email} from mailchimp`);
    // const statusRequest: UpdateStatusRequest = {
    //     status: ListMemberStatus.unsubscribed,
    //     email,
    // };
    // console.log(chalk.yellow("sending status request"), JSON.stringify(statusRequest, null, 2));
    // // MailchimpService.getSharedInstance()
    // const response = await MailchimpService.getSharedInstance().updateMemberStatus(statusRequest);
    // let cactusMember: CactusMember | undefined = undefined;
    // if (response.listMember) {
    //     cactusMember = await AdminCactusMemberService.getSharedInstance().updateFromMailchimpListMember(response.listMember);
    //     console.log("updated member after changing the status", cactusMember);
    // }
    //
    // const attachments: SlackAttachment[] = [];
    // const fields: SlackAttachmentField[] = [
    //     {
    //         title: "Email",
    //         value: statusRequest.email,
    //         short: false,
    //     },
    //     {
    //         title: "Reason Code",
    //         value: `Unsubscribed from an email`,
    //         short: false,
    //     },
    //
    //     {
    //         title: "Cactus Member ID",
    //         value: (cactusMember ? cactusMember.id : "") || "not found",
    //         short: false,
    //     },
    //     {
    //         title: "Sign Up Date",
    //         value: (cactusMember && cactusMember.signupConfirmedAt) ? getISODate(cactusMember.signupConfirmedAt) : "Unknown"
    //     }
    // ];
    //
    // attachments.push({
    //     title: `${statusRequest.email} ${statusRequest.status === ListMemberStatus.unsubscribed ? "Unsubscribed" : "Re-Subscribed"}`,
    //     fields: fields
    // });
    //
    // const slackMessage = {
    //     text: `User Has manually ${statusRequest.status === ListMemberStatus.unsubscribed ? "Unsubscribed" : "Re-Subscribed"}`,
    //     attachments
    // };
    //
    // await AdminSlackService.getSharedInstance().sendActivityMessage(slackMessage);
    //
    //
    // if (response.success){
    //     res.status(302);
    //     const successMessage = "You have successfully unsubscribed";
    //     res.redirect(`${getHostname()}${PageRoute.UNSUBSCRIBE_SUCCESS}?${QueryParam.MESSAGE}=${encodeURIComponent(successMessage)}&${QueryParam.EMAIL}=${encodeURIComponent(email)}&${QueryParam.UNSUBSCRIBE_SUCCESS}=true`)
    // } else {
    //     const errorMessage = `Something went wrong while unsubscribing you from our emails. \n${response.error?.message ? response.error.message : response.error}`.trim();
    //     res.redirect(`${getHostname()}${PageRoute.UNSUBSCRIBE_SUCCESS}?${QueryParam.MESSAGE}=${encodeURIComponent(errorMessage)}&${QueryParam.EMAIL}=${encodeURIComponent(email)}&${QueryParam.UNSUBSCRIBE_SUCCESS}=false`)
    // }
});

export default app