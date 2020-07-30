import * as express from "express";
import * as cors from "cors";
import * as functions from "firebase-functions";
import * as Sentry from "@sentry/node";
import { processEmail } from "@api/inbound/EmailProcessor"
import { saveEmailReply } from "@api/services/emailService";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import TestModel from "@shared/models/TestModel";
import { fromJSON } from "@shared/util/FirestoreUtil";
import { EmailStoragePath } from "@shared/models/EmailReply";
import { writeToFile } from "@api/util/FileUtil";
import AdminReflectionPromptService from "@admin/services/AdminReflectionPromptService";
import ReflectionResponse from "@shared/models/ReflectionResponse";
import AdminReflectionResponseService from "@admin/services/AdminReflectionResponseService";
import MailchimpService from "@admin/services/MailchimpService";
import AdminSlackService from "@admin/services/AdminSlackService";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import AdminSentCampaignService from "@admin/services/AdminSentCampaignService";
import { getConfig } from "@admin/config/configService";
import Logger from "@shared/Logger";
import { ResponseMedium } from "@shared/util/ReflectionResponseUtil";
import { SentryExpressHanderConfig } from "@api/util/RequestUtil";

const logger = new Logger("inboundApp");
const app = express();
const config = getConfig();

app.use(Sentry.Handlers.requestHandler(SentryExpressHanderConfig) as express.RequestHandler);

app.use(cors({origin: config.allowedOrigins}));

app.get('/', (req, res) => res.status(200).json({status: 'ok'}));

app.get('/testModel/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
             res.status(400);
             return
        }

        const model = await AdminFirestoreService.getSharedInstance().getById(id, TestModel);

        if (!model) {
            res.sendStatus(404);
            return
        }
        logger.log("model.name", model.name);
        res.status(200).json({ status: 'ok', data: model.toJSON() })
        return;
    } catch (error) {
        logger.error(error);
        res.status(500).send({success: false, error: error.message})
    }
});

app.post("/testModel", async (req, res) => {
    try {
        logger.log("body", JSON.stringify(req.body));
        const model = fromJSON(req.body, TestModel);
        logger.log("model", JSON.stringify(model));
        const saved = await AdminFirestoreService.getSharedInstance().save(model);
        logger.log("saved object", saved);
        res.send({data: saved.toJSON()})
    } catch (e) {
        logger.error(e);
        res.status(500).send({error: e});
    }
});

/**
 * NOTE: turns out cloud functions request middleware isn't the plain, standard express app you might think.
 * As a result, often the body may be different than expected, or not exist at all.
 * Usually, you can access the `req.rawBody` to get the original contents,
 * but it will not exist via the emulator (i.e. running `server` locally). So, you have to either check for both rawBody & body,
 * or have faith that rawBody will be there when deployed.
 * ref: Doug Stevenson's answer here:
 * https://stackoverflow.com/questions/47242340/how-to-perform-an-http-file-upload-using-express-on-cloud-functions-for-firebase/47319614#47319614
 */
app.post("/", async (req: functions.https.Request | any, res: express.Response) => {
    const mailchimpService = MailchimpService.getSharedInstance();
    const slackService = AdminSlackService.getSharedInstance();
    try {
        const dateId = (new Date()).getTime();
        const bodyStoragePath = await writeToFile(`./output/${dateId}_body.txt`, req.rawBody || req.body);
        const headersStoragePath = await writeToFile(`./output/${dateId}_headers.txt`, JSON.stringify(req.headers));

        const emailReply = await processEmail(req.headers, req.rawBody || req.body);
        if (!emailReply) {
            logger.warn("Unable to process an EmailReply");
            await slackService.sendActivityNotification("ERROR: Failed to process incoming email: no email was returned");
            res.sendStatus(500);
            return;
        }

        const {mailchimpCampaignId, mailchimpUniqueEmailId, from, reflectionPromptId} = emailReply;

        let prompt: ReflectionPrompt | undefined = undefined;
        if (reflectionPromptId) {
            logger.log("fetching reflection prompt by reflectionPromptId found on email address");
            prompt = await AdminReflectionPromptService.getSharedInstance().get(reflectionPromptId);
        }

        if (!prompt) {
            logger.log("Prompt still not found, trying to fetch it via campaign id");
            try {
                prompt = await AdminReflectionPromptService.getSharedInstance().getPromptForCampaignId(mailchimpCampaignId);
            } catch (promptError) {
                logger.error("Failed to get prompt by campaign id - error", promptError);
            }
            if (!prompt) {
                logger.log("Unable to find prompt by campaign id");
            } else {
                logger.log("found prompt by campaign id", prompt.id);
            }

        }

        const listMember = await mailchimpService.getMemberByUniqueEmailId(mailchimpUniqueEmailId);
        let cactusMember = await AdminCactusMemberService.getSharedInstance().getByMailchimpUniqueEmailId(mailchimpUniqueEmailId);
        const sentCampaign = await AdminSentCampaignService.getSharedInstance().getByCampaignId(mailchimpCampaignId);

        let campaignLink: string | undefined = undefined;
        if (sentCampaign && sentCampaign.campaign) {
            campaignLink = `<https://us20.admin.mailchimp.com/reports/summary?id=${sentCampaign.campaign.web_id}|${sentCampaign.campaign.settings.title}>`
        }

        if (!cactusMember) {
            logger.log("No cactus member was found using mailchimp unique id, trying with the from email " + emailReply.from.email);
            cactusMember = await AdminCactusMemberService.getSharedInstance().getMemberByEmail(emailReply.from.email);
        }

        let listMemberLink: string | undefined = undefined;
        if (listMember) {
            listMemberLink = `<https://us20.admin.mailchimp.com/lists/members/view?id=${listMember.web_id}|Mailchimp Member ${listMember.id}>`
        }


        logger.log("Saving the EmailReply to the database");
        emailReply.setStoragePath(EmailStoragePath.BODY, bodyStoragePath);
        emailReply.setStoragePath(EmailStoragePath.HEADERS, headersStoragePath);
        emailReply.mailchimpMemberId = listMember ? listMember.id : undefined;
        emailReply.reflectionPromptId = prompt ? prompt.id : undefined;

        //TODO: Make this a real service with models and stuff
        const savedEmail = await saveEmailReply(emailReply);


        if (!prompt) {
            logger.warn(`No reflection prompt found still, not saving response from email ${cactusMember ? cactusMember.email : emailReply.from.email}`);
            await AdminSlackService.getSharedInstance().sendActivityMessage({
                text: `:warning: Received an email from cactus member ${cactusMember ? cactusMember.email : "unknown"} (sent from ${emailReply.from.email}) but no Reflection Prompt could be found from the email`,
                attachments: [
                    {
                        color: "warning",
                        fields: [
                            {
                                title: "Subject",
                                value: emailReply.subject || "--",
                                short: false,
                            },
                            {
                                title: "Sent From",
                                value: emailReply.from.email || "--",
                                short: false,
                            },
                            {
                                title: "Sent To",
                                value: emailReply.to.email || "--",
                                short: false,
                            },
                            {
                                title: campaignLink ? "Mailchimp Campaign" : "Mailchimp Campaign ID",
                                value: campaignLink ? campaignLink : mailchimpCampaignId || "--",
                                short: false,
                            },
                            {
                                title: listMemberLink ? "Mailchimp List Member" : "Mailchimp List Member ID",
                                value: listMemberLink || (listMember ? listMember.id || "--" : "--"),
                                short: false,
                            },
                            {
                                title: "Cactus Member ID",
                                value: cactusMember ? cactusMember.id || "--" : "--",
                                short: false,
                            }
                        ]
                    }
                ]
            });
            res.sendStatus(204);
            return;
        }

        const promptResponse = new ReflectionResponse();
        promptResponse.content.text = emailReply.replyText;
        promptResponse.emailReplyId = savedEmail ? savedEmail.id : undefined;
        promptResponse.promptId = prompt.id;
        promptResponse.promptQuestion = prompt ? prompt.question : undefined;
        promptResponse.responseMedium = ResponseMedium.EMAIL;

        if (cactusMember) {
            promptResponse.cactusMemberId = cactusMember.id;
        }

        let resetUserResponse;
        if (listMember) {
            promptResponse.memberEmail = listMember.email_address;
            promptResponse.mailchimpUniqueEmailId = listMember.unique_email_id;
            promptResponse.mailchimpMemberId = listMember.id;
        } else {
            await slackService.sendActivityNotification({text: `:warning: Resetting reminder notification using the email's "from" address (${from.email}) because we shouldn't find a mailchimp ListMember. EmailReply.id = ${savedEmail ? savedEmail.id : "unknown"}`});
            resetUserResponse = await AdminReflectionResponseService.resetUserReminder(from.email);
            if (!resetUserResponse.success) {
                logger.log("reset user reminder failed", resetUserResponse);
                await slackService.sendActivityNotification(`:warning: Failed to reset user reminder for ${from.email}\n\`\`\`${JSON.stringify(resetUserResponse)}\`\`\``)
            }
        }

        const savedReflectionResponse = await AdminReflectionResponseService.getSharedInstance().save(promptResponse);

        if (savedReflectionResponse) {
            logger.log("Saved reflection response", JSON.stringify(promptResponse.toJSON()))
        }

        res.send({email: (savedEmail || emailReply).toJSON()});
    } catch (error) {
        logger.error("Failed to process incoming email", error);
        await slackService.sendActivityNotification("ERROR: Failed to process incoming email: " + `${error}`);
        res.sendStatus(500);
    }
});

app.use(Sentry.Handlers.errorHandler() as express.ErrorRequestHandler);
export default app;