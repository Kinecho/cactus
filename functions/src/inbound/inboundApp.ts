import * as express from "express";
import * as cors from "cors";
import {inspect, promisify} from "util";
import {sendActivityNotification} from "@api/slack/slack";
import Email, {InboundEmail} from "@api/inbound/models/Email";
import {InboundAttachmentInfo} from "@api/inbound/models/EmailAttachment";
const path = require("path");
const os = require("os");
const fs = require("fs");
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
    console.log("Starting email inbound hook");
    console.log();
    console.log("========= HEADERS ==========");
    console.log(JSON.stringify(req.headers));
    console.log("========= END HEADERS ==========");
    console.log();

    console.log();
    console.log("========= BODY ==========");
    console.log(req.body);
    console.log("========= END BODY ==========");
    console.log();

    try {

        try {await promisify(fs.mkdir)("./output", {recursive: true});} catch (error){}
        await promisify(fs.writeFile)(`./output/${(new Date()).getTime()}_body.txt`, req.body);
        await promisify(fs.writeFile)(`./output/raw_body-${(new Date()).getTime()}_raw_body.txt`, req.rawBody);
        await promisify(fs.writeFile)(`./output/${(new Date()).getTime()}_headers.txt`, JSON.stringify(req.headers));
        await promisify(fs.writeFile)(`./output/${(new Date()).getTime()}_raw_headers.txt`, JSON.stringify(req.rawHeaders));
    } catch (error){
        console.log("failed to write to file", error);
    }

    try {
        const busboy = new Busboy({headers: req.headers});

        // This object will accumulate all the uploaded files, keyed by their name
        const uploads: { [key: string]: any } = {};
        const emailInput: InboundEmail = {};


        //TODO: make email class to hold fields

        // This callback will be invoked for each file uploaded

        busboy.on("data", function(){
            console.log("busboy on data", arguments);
        });

        busboy.on("part", function(){
            console.log("busboy on part", arguments);
        });


        busboy.on("error", (error:any) => {
            console.error("failed to process something", error);
            // res.sendStatus(500);
        });

        busboy.on('file', (fieldname: string,
                           file: NodeJS.ReadableStream,
                           filename: string,
                           encoding: string,
                           mimetype: string) => {

            file.on("error", (error:any) => {
                console.error("failed to process file", error);

            });

            console.log(`File [${fieldname}] filename: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`);
            // Note that os.tmpdir() is an in-memory file system, so should only
            // be used for files small enough to fit in memory.
            const filepath = path.join(os.tmpdir(), fieldname);

            uploads[fieldname] = {file: filepath};
            console.log(`Saving '${fieldname}' to ${filepath}`);
            file.pipe(fs.createWriteStream(filepath));
        });


        busboy.on('field', getFieldHandler(emailInput));

        // This callback will be invoked after all uploaded files are saved.
        busboy.on('finish', async () => {
            console.log();
            console.log("Finished processing body. email input", JSON.stringify(emailInput, null, 2));
            const email = new Email(emailInput);
            console.log();
            console.log("Processed email", JSON.stringify(email, null, 2));

            await sendActivityNotification(`Processed inbound email reply from ${email.from ? email : "unknown"}\n \`\`\`${JSON.stringify(email, null, 2)}\`\`\``)
            res.send(email);
        });

        // The raw bytes of the upload will be in req.rawBody.  Send it to busboy, and get
        // a callback when it's finished.


        busboy.end(req.rawBody || req.body);
        // console.log("=================== raw body below ===================");
        // console.log();
        // console.log(req.rawBody || req.body);
        // console.log();
        // console.log("==================== end raw body ============+========")
    } catch (error){
        console.error("failed to process email", error);
        await sendActivityNotification("ERROR: Failed to process incoming email");
        res.sendStatus(500);
    }
});


function getFieldHandler(email: InboundEmail){
    console.log("field handler for email", email);
    return function (fieldname: string,
                     val: any,
                     fieldnameTruncated: boolean,
                     valTruncated: boolean,
                     encoding: string,
                     mimetype: string){

            console.log('Field [' + fieldname + ']: value: ' + inspect(val));

            switch (fieldname) {
                case 'headers':
                    break;
                case "dkim":
                    break;
                case "html":
                    email.html = val;
                    break;
                case "to":
                    email.toRaw = val;
                    break;
                case "from":
                    email.fromRaw = val;
                    break;
                case "text":
                    email.text = val;
                    break;
                case "sender_ip":
                    break;
                case "envelope":
                    break;
                case "attachment-info":
                    email.attachments = processAttachments(val);
                    break;
                case "subject":
                    email.subject = val;
                    break;
                case "charsets":
                    break;
                case "SPF":
                    break;
                default:
                    console.warn("field name", fieldname, "not handled");
                    break;
            }
    }
}

function processAttachments(input:{[key: string]: InboundAttachmentInfo}):Array<InboundAttachmentInfo> {
    try {
        console.log("processing attachments");
        inspect(input);
        return Object.values(input)
    } catch (error){
        console.error("failed to parse attachments");
        return [];
    }

}


export default app;