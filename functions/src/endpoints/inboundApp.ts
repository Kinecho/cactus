import * as express from "express";
import * as cors from "cors";
import * as functions from "firebase-functions";
import {processEmail} from "@api/inbound/EmailProcessor"
import {getMailchimpDateString} from "@shared/util/DateUtil";
import {saveEmailReply} from "@api/services/emailService";
import AdminFirestoreService from "@shared/services/AdminFirestoreService";
import TestModel from "@shared/models/TestModel";
import {fromJSON} from "@shared/util/FirestoreUtil";
import EmailReply, {EmailStoragePath} from "@shared/models/EmailReply";
import {writeToFile} from "@api/util/FileUtil";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import AdminReflectionPromptService from "@shared/services/AdminReflectionPromptService";
import ReflectionResponse, {ResponseMedium} from "@shared/models/ReflectionResponse";
import AdminReflectionResponseService from "@shared/services/AdminReflectionResponseService";
import MailchimpService from "@shared/services/MailchimpService";
import {ListMember} from "@shared/mailchimp/models/MailchimpTypes";
import AdminSlackService, {
    AttachmentColor,
    SlackAttachmentField,
    SlackMessage
} from "@shared/services/AdminSlackService";
import bodyParser = require("body-parser");

const app = express();


app.use(cors({origin: true}));

app.get('/', (req, res) => res.status(200).json({status: 'ok'}));

app.get('/testModel/:id', async (req, res) => {

    const id = req.params.id;
    if (!id) {
        return res.status(400);
    }

    const model = await AdminFirestoreService.getSharedInstance().getById(id, TestModel);

    if (!model) {
        return res.sendStatus(404);
    }


    console.log("model.name", model.name);

    return res.status(200).json({status: 'ok', data: model.toJSON()})

});

app.post("/testModel", bodyParser.json(), async (req, res) => {

    try {
        console.log("body", JSON.stringify(req.body));
        const model = fromJSON(req.body, TestModel);
        console.log("model", JSON.stringify(model));
        const saved = await AdminFirestoreService.getSharedInstance().save(model);
        console.log("saved object", saved);
        res.send({data: saved.toJSON()})
    } catch (e) {
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
            console.warn("Unable to process an EmailReply");
            await slackService.sendActivityNotification("ERROR: Failed to process incoming email: no email was returned");
            res.sendStatus(500);
            return;
        }

        const {mailchimpCampaignId, mailchimpUniqueEmailId, from} = emailReply;

        const listMember = await mailchimpService.getMemberByUniqueEmailId(mailchimpUniqueEmailId);
        const prompt = await AdminReflectionPromptService.getSharedInstance().getPromptForCampaignId(mailchimpCampaignId);

        emailReply.setStoragePath(EmailStoragePath.BODY, bodyStoragePath);
        emailReply.setStoragePath(EmailStoragePath.HEADERS, headersStoragePath);
        emailReply.mailchimpMemberId = listMember ? listMember.id : undefined;
        emailReply.reflectionPromptId = prompt ? prompt.id : undefined;

        //TODO: Make this a real service with models and stuff
        const savedEmail = await saveEmailReply(emailReply);

        const promptResponse = new ReflectionResponse();
        promptResponse.content.text = emailReply.replyText;
        promptResponse.emailReplyId = savedEmail ? savedEmail.id : undefined;
        promptResponse.promptId = prompt ? prompt.id : undefined;
        promptResponse.promptQuestion = prompt ? prompt.question : undefined;
        promptResponse.responseMedium = ResponseMedium.EMAIL;

        let resetUserResponse;
        if (listMember) {
            promptResponse.memberEmail = listMember.email_address;
            promptResponse.mailchimpUniqueEmailId = listMember.unique_email_id;
            promptResponse.mailchimpMemberId = listMember.id;
            // NOTE: this task is now run on the ReflectionResponseTrigger function
            // resetUserResponse = await AdminReflectionResponseService.resetUserReminder(listMember.email_address);
            // if (!resetUserResponse.success) {
            //     console.log("reset user reminder failed", resetUserResponse);
            //     await slackService.sendActivityNotification(`:warning: Failed to reset user reminder for ${listMember.email_address}\n\`\`\`${JSON.stringify(resetUserResponse)}\`\`\``)
            // }
        } else {
            await slackService.sendActivityNotification({text: `:warning: Resetting reminder notification using the email's "from" address (${from.email}) because we shouldn't find a mailchimp ListMember. EmailReply.id = ${savedEmail ? savedEmail.id : "unknown"}`});
            resetUserResponse = await AdminReflectionResponseService.resetUserReminder(from.email);
            if (!resetUserResponse.success) {
                console.log("reset user reminder failed", resetUserResponse);
                await slackService.sendActivityNotification(`:warning: Failed to reset user reminder for ${from.email}\n\`\`\`${JSON.stringify(resetUserResponse)}\`\`\``)
            }
        }

        const savedReflectionResponse = await AdminReflectionResponseService.getSharedInstance().save(promptResponse);

        if (savedReflectionResponse) {
            console.log("Saved reflection response", JSON.stringify(promptResponse.toJSON()))
        }

        let messageColor = undefined;
        let message = "Successfully processed a reflection response!";
        if (!savedEmail) {
            messageColor = AttachmentColor.error;
            message = `:rotating_light: Unable to save the email reply. The following details from ${from.email} have not been fully saved to Firestore`;
        }
        await sendSlackMessage(savedEmail || emailReply, prompt, savedReflectionResponse, listMember, message, messageColor);

        res.send({email: (savedEmail || emailReply).toJSON()});
    } catch (error) {
        await slackService.sendActivityNotification("ERROR: Failed to process incoming email: " + `${error}`);
        res.sendStatus(500);
    }
});


async function sendSlackMessage(email: EmailReply,
                                prompt?: ReflectionPrompt,
                                response?: ReflectionResponse,
                                sentToMember?: ListMember,
                                message = "Got a reply!",
                                color = AttachmentColor.info): Promise<void> {
    const messageColor = color;
    const msg: SlackMessage = {};
    msg.text = message;

    const fromEmail = email.from && email.from.email ? email.from.email : null;
    const campaign = email.mailchimpCampaignId ? await MailchimpService.getSharedInstance().getCampaign(email.mailchimpCampaignId) : null;

    const fields: SlackAttachmentField[] = [];

    if (prompt) {
        let contentLink = "";
        if (prompt.question && prompt.contentPath) {
            contentLink = `<https://cactus.app${prompt.contentPath && !prompt.contentPath.startsWith("/") ? `/${prompt.contentPath}` : prompt.contentPath}|${prompt.question}>`
        }
        fields.push(
            {
                title: "Prompt Question",
                value: `${contentLink}`,
                short: false,
            }
        )
    } else {
        fields.push(
            {
                title: "from",
                value: fromEmail || "unknown",
                short: false,
            },
            {
                title: "subject",
                value: email.subject || "unknown",
                short: false,
            },
            {
                title: "Campaign Id",
                value: email.mailchimpCampaignId || "unknown",
                short: true,
            },
            {
                title: "Campaign Title",
                value: campaign ? campaign.settings.title : "",
                short: false
            },
            {
                title: "Campaign Subject",
                value: campaign ? campaign.settings.subject_line : "",
                short: false
            },
            {
                title: "Campaign Send Date",
                value: campaign ? getMailchimpDateString(new Date(campaign.send_time)) : "unknown",
                short: true
            }
        );
    }


    if (email.mailchimpUniqueEmailId) {
        console.log("looking for member on list with unique email id = ", email.mailchimpUniqueEmailId);
        // const sentToMember = await getMemberByEmailId(email.mailchimpUniqueEmailId);
        console.log("sent to member found to be", sentToMember);

        fields.unshift(
            {
                title: "List Member Email",
                value: (sentToMember && sentToMember.email_address) ? sentToMember.email_address : "not found",
                short: false,
            },
            {
                title: "Mailchimp Unique Email ID",
                value: email.mailchimpUniqueEmailId,
                short: false,
            })
    } else {
        console.log("unable to find email id on processed email");
    }

    msg.attachments = [{
        color: messageColor,
        ts: `${(new Date()).getTime() / 1000}`,
        fields,
    }];

    await AdminSlackService.getSharedInstance().sendActivityNotification(msg);

}

export default app;