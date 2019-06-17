import * as express from "express";
import * as cors from "cors";
import {sendActivityNotification, SlackMessage} from "@api/slack/slack";
import {forwardedGmailEmail, getSenderFromHeaders, processEmail} from "@api/inbound/EmailProcessor"
import {writeToFile} from "@api/util/FileUtil";
import {
    getCampaign,
    getMemberByEmailId,
    UpdateMergeFieldRequest,
    updateMergeFields,
    updateTags,
    UpdateTagsRequest
} from "@api/mailchimp/mailchimpService";
import {MergeField, TagName, TagStatus} from "@shared/mailchimp/models/ListMember";
import {getMailchimpDateString} from "@api/util/DateUtil";
import * as getRawBody from 'raw-body';
import {logEmailReply} from "@api/services/emailService";
import {getById, save} from "@api/services/firestoreService";
import TestModel from "@shared/models/TestModel";
import {fromJSON} from "@shared/util/FirebaseUtil";
import {EmailStoragePath} from "@shared/models/EmailReply";
import bodyParser = require("body-parser");

const app = express();

app.use(cors({origin: true}));

app.get('/', (req, res) => res.status(200).json({status: 'ok'}));

app.get('/testModel/:id', async (req, res) => {

    const id = req.params.id;
    if (!id) {
        return res.status(400);
    }

    const model = await getById(id, TestModel);

    if (!model){
        return res.sendStatus(404);
    }


    return res.status(200).json({status: 'ok', data: model.toJSON()})

});

app.post("/testModel", bodyParser.json(), async (req, res) => {

    try {
        console.log("body", JSON.stringify(req.body));
        const model = await fromJSON(req.body, TestModel);
        console.log("model", JSON.stringify(model));
        const saved = await save(model);
        console.log("saved object", saved);
        res.send({data: await saved.toJSON()})
    } catch (e){
        res.status(500).send({error: e});
    }


});

/**
 * NOTE: turns out cloud functions request middleware isn't the plain, standard express app you might think. As a result, often the body may be different than expected, or not exist at all.
 * Usually, you can access the `req.rawBody` to get the original contents, but it will not exist via the emulator (i.e. running `server` locally). So, you have to either check for both rawBody & body,
 * or have faith that rawBody will be there when deployed.
 * ref: Doug Stevenson's answer here: https://stackoverflow.com/questions/47242340/how-to-perform-an-http-file-upload-using-express-on-cloud-functions-for-firebase/47319614#47319614
 */
app.post("/", async (req: express.Request | any, res: express.Response) => {
    const date = new Date();
    const dateId = date.getTime();

    try {
        console.log("content length", req.headers["content-length"]);
        console.log("req.rawBody defined?", !!req.rawBody);
        console.log("req.body defined?", !!req.body);
        if(req.rawBody === undefined && req.method === 'POST' && req.headers['content-type'] !== undefined && req.headers['content-type'].startsWith('multipart/form-data')) {
            console.log("attempting to parse raw body");
            const _rawBody = await getRawBody(req, {
                length: req.headers['content-length'],
                limit: '10mb',
                encoding: "utf-8"});
            await writeToFile(`./output/${dateId}_npm_raw_body.txt`, _rawBody);
        } else {
            console.log("not parsing raw body");
        }
    } catch (e){
        console.error(e);
    }

    const bodyStoragePath = await writeToFile(`./output/${dateId}_body.txt`, req.body);
    const rawBodyStoragePath = await writeToFile(`./output/${dateId}_raw_body.txt`, req.rawBody || req.body);
    const headersStoragePath = await writeToFile(`./output/${dateId}_headers.txt`, JSON.stringify(req.headers));
    const rawHeadersStoragePath = await writeToFile(`./output/${dateId}_raw_headers.txt`, JSON.stringify(req.rawHeaders));

    try {
        const email = await processEmail(req.headers, req.rawBody || req.body);

        if (!email){
            await sendActivityNotification("ERROR: Failed to process incoming email: no email was returned");
            res.sendStatus(500);
            return;
        }

        email.setStoragePath(EmailStoragePath.BODY, bodyStoragePath);
        email.setStoragePath(EmailStoragePath.HEADERS, headersStoragePath);
        email.setStoragePath(EmailStoragePath.RAW_BODY, rawBodyStoragePath);
        email.setStoragePath(EmailStoragePath.RAW_HEADERS, rawHeadersStoragePath);

        //Log to firestore
        await logEmailReply(email);

        let messageColor = "#83ecf9";
        console.log();
        // console.log("Processed email", JSON.stringify(email, null, 2));

        await writeToFile(`./output/${dateId}_processed_email.json`, JSON.stringify(email));


        const msg: SlackMessage = {};
        msg.text = `Got a reply!`;

        const fromEmail = email.from && email.from.email ? email.from.email : null;
        const fromHeader = getSenderFromHeaders(email.headers);

        const campaign = email.mailchimpCampaignId ? await getCampaign(email.mailchimpCampaignId) : null;

        const fields = [
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
        ];

        if (fromHeader && fromHeader !== fromEmail && fromHeader !== forwardedGmailEmail) {
            messageColor = "#7A3814";
            msg.text = `:warning: ${msg.text} (we are still using the original email, will update if we see that the smtp.mailfrom is consistently correct)`;
            fields.push(
                {
                    title: "smtp.mailfrom (from address)",
                    value: fromHeader || "unknown",
                    short: false,
                })
        }

        if (email.mailchimpUniqueEmailId) {
            console.log("loooking for member on list with unique email id = ", email.mailchimpUniqueEmailId);
            const sentToMember = await getMemberByEmailId(email.mailchimpUniqueEmailId);
            console.log("sent to member found to be", sentToMember);

            fields.unshift(
                {
                    title: ":merperson: List Member Email (from link)",
                    value: sentToMember ? sentToMember.email_address : "not found",
                    short: true,
                },
                {
                    title: "Unique Email Id from body",
                    value: email.mailchimpUniqueEmailId,
                    short: true,
                })
        } else {
            console.log("unable to find email id on processed email");
        }


        msg.attachments = [{
            color: messageColor,
            ts: `${(new Date()).getTime() / 1000}`,
            fields,
        }];

        await sendActivityNotification(msg);

        const mailchimpEmail = fromEmail;
        if (mailchimpEmail) {
            console.log("updating merge tag for user", email.mailchimpMemberId);
            const mergeRequest: UpdateMergeFieldRequest = {
                email: mailchimpEmail,
                mergeFields: {
                    [MergeField.LAST_REPLY]: getMailchimpDateString()
                }
            };

            const tagRequest: UpdateTagsRequest = {
                email: mailchimpEmail,
                tags: [
                    {
                        name: TagName.NEEDS_ONBOARDING_REMINDER,
                        status: TagStatus.INACTIVE
                    },
                ]
            };

            await updateMergeFields(mergeRequest);
            await updateTags(tagRequest);
        } else {
            console.warn("No mailchimp Member ID found on email, can't update merge fields");
        }
        let responseBody = {email: await email.toJSON()};
        res.send(responseBody);
    } catch(error) {
        await sendActivityNotification("ERROR: Failed to process incoming email: " +  `${error}`);
        res.sendStatus(500);
    }

});

export default app;