import * as express from "express";
import * as cors from "cors";
import {sendActivityNotification} from "@api/slack/slack";
import {InboundEmail, InboundEmailFiles} from "@api/inbound/models/Email";
import {createEmailFromInputs, getFieldHandler, getFileHandler} from "@api/inbound/EmailProcessor"
import {writeToFile} from "@api/util/FileUtil";
import {updateMergeFields, UpdateMergeFieldRequest} from "@api/mailchimp/mailchimpService";
import {MergeFieldBoolean, MergeField} from "@shared/mailchimp/models/ListMember";

const app = express();
const Busboy = require("busboy");
app.use(cors({ origin: true }));

app.get('/', (req, res) => res.status(200).json({status: 'ok'}));

/**
 * NOTE: turns out cloud functions request middleware isn't the plain, standard express app you might think. As a result, often the body may be different than expected, or not exist at all.
 * Usually, you can access the `req.rawBody` to get the original contents, but it will not exist via the emulator (i.e. running `server` locally). So, you have to either check for both rawBody & body,
 * or have faith that rawBody will be there when deployed.
 * ref: Doug Stevenson's answer here: https://stackoverflow.com/questions/47242340/how-to-perform-an-http-file-upload-using-express-on-cloud-functions-for-firebase/47319614#47319614
 */
app.post("/",  async (req: express.Request|any, res: express.Response) => {
    const date = new Date();
    const dateId = date.getTime();

    await writeToFile(`./output/${dateId}_body.txt`, req.body);
    await writeToFile(`./output/raw_body-${dateId}_raw_body.txt`, req.rawBody);
    await writeToFile(`./output/${dateId}_headers.txt`, JSON.stringify(req.headers));
    await writeToFile(`./output/${dateId}_raw_headers.txt`, JSON.stringify(req.rawHeaders));

    try {
        const busboy = new Busboy({headers: req.headers});
        const emailFiles:InboundEmailFiles = {};
        const emailInput: InboundEmail = {};

        busboy.on("error", (error:any) => {
            console.error("failed to process something", error);
        });

        busboy.on("file", getFileHandler(emailFiles));
        busboy.on('field', getFieldHandler(emailInput));

        // This callback will be invoked after all uploaded files are saved.
        busboy.on('finish', async () => {
            const email = await createEmailFromInputs(emailInput, emailFiles);
            console.log();
            console.log("Processed email", JSON.stringify(email, null, 2));

            await writeToFile(`./output/${dateId}_processed_email.json`, JSON.stringify(email));
            await sendActivityNotification(`Processed inbound email from ${email.from && email.from.email ? email.from.email : "unknown"}\n > ${email.subject}`)

            if (email.from && email.from.email){
                console.log("updating merge tag for user", email.mailchimpMemberId);
                const mergeRequest:UpdateMergeFieldRequest = {
                    email: email.from.email,
                    mergeFields: {
                        [MergeField.DO_REMIND]: MergeFieldBoolean.NO
                    }
                };
                await updateMergeFields(mergeRequest);
            } else {
                console.warn("No mailchimp Member ID found on email, can't update merge fields");
            }

            res.send(email);
        });

        // The raw bytes of the upload will be in req.rawBody.  Send it to busboy, and get
        // a callback when it's finished.
        busboy.end(req.rawBody || req.body);
    } catch (error){
        console.error("failed to process email", error);
        await sendActivityNotification("ERROR: Failed to process incoming email");
        res.sendStatus(500);
    }
});

export default app;