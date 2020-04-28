import * as express from "express";
import * as cors from "cors";
import { getConfig, getHostname } from "@admin/config/configService";
import AdminUserService from "@admin/services/AdminUserService";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import { getAuthUser, getAuthUserId } from "@api/util/RequestUtil";
import { DeleteUserRequest, FeatureAuthRequest } from "@shared/api/UserEndpointTypes";
import { SubscriptionTier } from "@shared/models/SubscriptionProductGroup";
import { QueryParam } from "@shared/util/queryParams";
import { PageRoute } from "@shared/PageRoutes";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import AdminSlackService, { ChannelName } from "@admin/services/AdminSlackService";
import Logger from "@shared/Logger";
import DownloadJournalJob from "@admin/jobs/DownloadJournalJob";
import DataExport from "@shared/models/DataExport";
import AdminDataExportService from "@admin/services/AdminDataExportService";
import { EmailDataParams, EmailDataResult } from "@shared/api/DataExportTypes";
import AdminSendgridService, { CactusSender, SendEmailResult } from "@admin/services/AdminSendgridService";
import { SendgridTemplate } from "@shared/models/EmailLog";

const logger = new Logger("userEndpoints");
const app = express();
const config = getConfig();

app.use(cors({ origin: config.allowedOrigins }));

app.post("/export-data", async (req: express.Request, resp: express.Response) => {
    logger.info("Starting email data function");
    const userId = await getAuthUserId(req);

    if (!userId) {
        resp.sendStatus(401);
        return;
    }

    const payload = req.body as EmailDataParams;
    const { email, sendEmail } = payload;

    const member = await AdminCactusMemberService.getSharedInstance().getMemberByUserId(userId);
    const memberId = member?.id;
    if (!member || !memberId) {
        resp.sendStatus(403);
        return;
    }

    const dataExport = new DataExport(memberId);
    dataExport.type = sendEmail ? "email" : "direct_download";
    dataExport.sendToEmail = email;

    await AdminDataExportService.getSharedInstance().save(dataExport);

    let downloadUrl = `${ getHostname() }/data-exports/${ dataExport.id }`;
    if (config.isEmulator) {
        downloadUrl = `http://localhost:5000/cactus-app-stage/us-central1/user/data-exports/${ dataExport.id }`;
    }

    let emailResult: SendEmailResult | undefined;
    if (sendEmail && email) {
        emailResult = await AdminSendgridService.getSharedInstance().sendTemplateAndLog({
            email,
            sender: CactusSender.SUPPORT,
            oneTime: false,
            template: SendgridTemplate.data_export,
            data: {
                link: downloadUrl
            },
        });
        if (emailResult?.didSend) {
            dataExport.emailSent = true;
            dataExport.emailLogId = emailResult?.emailLog?.id;
            await AdminDataExportService.getSharedInstance().save(dataExport);
        }
    }


    await AdminSlackService.getSharedInstance().sendMessage(ChannelName.customer_data_export, {
        text: `*${ member.email } has requested a data export.*\n`
        + `Export ID = \`${ dataExport.id }\`\n`
        + (sendEmail ? `Sent to: \`${ email }\`\n` : "")
        + (sendEmail ? `Email Send Success = \`${ emailResult?.didSend === true }\`` : "Direct Download")
    });

    let message = undefined;
    if (emailResult?.didSend === false) {
        message = `We were unable to send the email to ${ email }. Please try again later.`;
    }

    const response: EmailDataResult = {
        success: !sendEmail || (emailResult?.didSend === true),
        dataExportId: dataExport.id,
        downloadUrl,
        message
    };
    resp.send(response);

    return;
});

app.get("/data-exports/:id", async (req: express.Request, resp: express.Response) => {
    const dataExportId = req.params.id;

    const dataExport = await AdminDataExportService.getSharedInstance().getById(dataExportId);
    if (!dataExport) {
        resp.sendStatus(404);
        return;
    }

    const memberId = dataExport.memberId;
    const member = await AdminCactusMemberService.getSharedInstance().getById(memberId);
    if (!member) {
        resp.sendStatus(404);
        return;
    }

    const job = new DownloadJournalJob({ member, config: getConfig() });
    await job.fetchData();
    const journal = job.toSimpleJSON();

    await AdminDataExportService.getSharedInstance().logDownload(dataExportId);

    const zipFilePath = await job.zip();
    logger.info("file path ", zipFilePath);

    await AdminSlackService.getSharedInstance().sendMessage(ChannelName.customer_data_export, {
        text: `*Customer Data Export was downloaded.*\n`
        + `Member's Data: \`${ member.email } (${ member.id })\`\n`
        + `Export ID = \`${ dataExportId }\`\n`
        + `Number of Journal Entries = \`${ journal.length }\`\n`
        + `Download Count = \`${ dataExport.downloadCount + 1 }\`\n`
        + `Export Type = \`${ dataExport.type }\``
    });

    resp.append("Content-Disposition", `attachment; filename=cactus-data-${ memberId }.zip`);

    if (zipFilePath) {
        resp.download(zipFilePath);
    } else {
        resp.status(500).send("We were unable to generate your download file. Please try again later or contact help@cactus.app");
    }

    return;
});

app.post("/delete-permanently", async (req: functions.https.Request | any, resp: functions.Response) => {
    const requestUser = await getAuthUser(req);

    if (!requestUser?.uid) {
        logger.log("No auth user was found on the request");
        resp.sendStatus(401);
        return
    }

    const payload = req.body;
    const { email } = payload as DeleteUserRequest;

    const user = await AdminUserService.getSharedInstance().getByEmail(email);

    if (!user || user.id !== requestUser.uid) {
        logger.log("User not authorized");
        resp.sendStatus(403);
        return
    }

    if (!user?.email) {
        logger.log("User has no email address");
        resp.sendStatus(409);
        return
    }

    logger.log('Permanently deleting user... ', user.id);
    try {
        await admin.auth().deleteUser(user.id);
        logger.log('Deleted!');
        resp.status(200).send({ success: true });
        return;
    } catch (e) {
        logger.log("Error", e);
        resp.sendStatus(500);
        return
    }

    // don't expect to ever get here but just in case
    resp.sendStatus(500);
    return;
});


app.get("/feature-auth/core-values", async (req: functions.https.Request | any, resp: functions.Response) => {
    const queryParams = req.query;
    const { memberId } = queryParams as FeatureAuthRequest;
    const afterLoginUrl = `${ getHostname() }/feature-auth/core-values`;
    const loginUrl = `${ getHostname() }${ PageRoute.LOGIN }?${ QueryParam.MESSAGE }=${ encodeURIComponent("To continue to Core Values, please login.") }&${ QueryParam.REDIRECT_URL }=${ encodeURIComponent(afterLoginUrl) }`;

    if (!memberId) {
        // show an error message and instructions to upgrade
        logger.log("No memberId provided");
        resp.status(401).contentType("text/html").send('<html><body style="font-family: sans-serif; text-align: center; padding: 3rem 1rem; line-height: 150%;"><h3>To access Core Values, use must be logged-in to the latest version of Cactus.</h3><br><p><strong>iOS Users:</strong> <a style="color:#29A389" href="https://apps.apple.com/us/app/cactus-mindfulness-journal/id1474513514">Follow this link</a> to upgrade your app.<br><br>Still having problems? Email <a style="color:#29A389" href="mailto:help@cactus.app">help@cactus.app</a></p></body></html>');

        try {
            await AdminSlackService.getSharedInstance().sendActivityMessage({
                text: `Someone without a memberId tried to auth to Core Values.`
            });
        } catch (e) {
            logger.error(e);
        }

        return;
    }

    const member = await AdminCactusMemberService.getSharedInstance().getById(memberId);

    if (!member) {
        logger.log("No member could be found for memberId: ", memberId);
        resp.redirect(loginUrl);
        return;
    }

    if (member?.tier === SubscriptionTier.PLUS && member?.email) {
        logger.log('Member is PLUS. Redirecting to Core Values assessment...');
        resp.redirect(`${ getHostname() }${ PageRoute.CORE_VALUES }?${ QueryParam.CACTUS_MEMBER_ID }=${ memberId }&${ QueryParam.TIER }=${ member.tier }&${ QueryParam.DISPLAY_NAME }=${ encodeURIComponent(member.firstName || '') }`);

        try {
            await AdminSlackService.getSharedInstance().sendActivityMessage({
                text: `PLUS member ${ member.email } authorized to Core Values`
            });
        } catch (e) {
            logger.error(e);
        }

        return;
    } else {
        const pricingUrl = `${ getHostname() }${ PageRoute.PRICING }?${ QueryParam.CORE_VALUES }=true}`;
        resp.redirect(pricingUrl);

        try {
            await AdminSlackService.getSharedInstance().sendActivityMessage({
                text: `BASIC member ${ member.email } authorized to Core Values. Redirected to Upgrade Page.`
            });
        } catch (e) {
            logger.error(e);
        }

        return;
    }

    resp.sendStatus(500);
    return;
});

export default app