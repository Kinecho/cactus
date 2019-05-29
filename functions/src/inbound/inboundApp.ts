import * as express from "express";
import * as cors from "cors";
import {inspect} from "util";
import {sendActivityNotification} from "@api/slack/slack";
// const bodyParser = require("body-parser");
// import {AttachmentStream, MailParser, MessageText} from "mailparser";
// import {simpleParser} from "mailparser";
// const multer = require("multer")
const path = require("path");
const os = require("os");
const fs = require("fs");
const app = express();
const Busboy = require("busboy");
// const Parser = require("@sendgrid/inbound-mail-parser");
// const formidable = require("express-formidable");
// Automatically allow cross-origin requests
app.use(cors({ origin: true }));
// app.use(bodyParser.raw());
// app.use(multer().none());
// app.use(formidable())
//     encoding: 'utf-8',
//     // uploadDir: '/my/dir',
//     multiples: true, // req.files to be arrays of files
// }));
// const upload = multer();
//
//
// app.use(express.json({limit: '10mb'}));
// app.use(express.urlencoded({
//     extended: true,
//     type: "multipart/form-data",
//     limit: '10mb'
// }));

// app.use(formidable());


app.get('/', (req, res) => res.status(200).json({status: 'ok'}))

app.post("/",  async (req: express.Request|any, res: express.Response) => {
    // console.log("req.rawBody", req.rawBody);
    // console.log("req.body", req.body);

    // try {
    //     const parsed = await simpleParser(req.rawBody);
    //
    //     // const {headers subject, from, to, cc, bcc, messageId, inReplyTo, date, html, replyTo, text, references} = parsed;
    //     console.log("parsed body successfully", parsed);
    //
    //
    //     const custom = {
    //         headers: parsed.headers,
    //         // @ts-ignore
    //         // contentDispositionParams: JSON.stringify(parsed.headers.get("content-disposition").params),
    //         // @ts-ignore
    //         // contentDispositionValue: JSON.stringify(parsed.headers.get("content-disposition").value),
    //         // contentDisposition: parsed.headers.get("content-disposition")
    //         text: parsed.text,
    //         textAsHtml: parsed.textAsHtml,
    //         html: parsed.html,
    //         messageId: parsed.messageId,
    //         from: parsed.from,
    //         to: parsed.to,
    //         subject: parsed.subject,
    //         attachmentCount: parsed.attachments ? parsed.attachments.length : 0
    //     };
    //
    //     // var attachments = parsed.attachments;
    //
    //
    //     let responseBody = {
    //         requestHeaders: JSON.stringify(req.headers),
    //
    //         contentString: "",
    //         // parsed: parsed,
    //         // request: req,
    //         custom,
    //         doubleParsed: {}
    //
    //     };
    //
    //
    //     // if (attachments && attachments.length > 0) {
    //     //     let attachmentBuffer = attachments[0];
    //     //     let content = attachmentBuffer.content;
    //     //     let contentString = content.toString("utf8");
    //     //     console.log("attachmetn content string", contentString);
    //     //     responseBody.contentString = contentString;
    //     //
    //     //     let doubleParsed = await simpleParser(contentString);
    //     //     console.log("double parsed", doubleParsed);
    //     //     responseBody.doubleParsed = doubleParsed;
    //     //
    //     // }
    //
    //
    //     console.log("responseBody", JSON.stringify(responseBody));
    //
    //     console.log("parsed custom data", custom);
    //
    //     res.status(200);
    //     return res.send(responseBody)



    // } catch (error){
    //     console.error("failed to parse email body", error)
    //     res.status(400);
    //     return res.send({body: req.body, headers: req.headers, rawBody: req.rawHeaders});
    // }

    const busboy = new Busboy({ headers: req.headers });
    // This object will accumulate all the uploaded files, keyed by their name
    const uploads = {};
    var email = {};
    // This callback will be invoked for each file uploaded
    // @ts-ignore
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        console.log(`File [${fieldname}] filename: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`);
        // Note that os.tmpdir() is an in-memory file system, so should only
        // be used for files small enough to fit in memory.
        const filepath = path.join(os.tmpdir(), fieldname);
        // @ts-ignore
        uploads[fieldname] = { file: filepath }
        console.log(`Saving '${fieldname}' to ${filepath}`);
        file.pipe(fs.createWriteStream(filepath));
    });

    // @ts-ignore
    busboy.on('field', (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) => {
        console.log('Field [' + fieldname + ']: value: ' + inspect(val));
        // @ts-ignore
        email[fieldname] = val;
    });

    // This callback will be invoked after all uploaded files are saved.
    busboy.on('finish', async () => {
        console.log("finished", JSON.stringify(email, null, 2));
        // for (const name in uploads) {
        //     // @ts-ignore
        //     const upload = uploads[name];
        //     const file = upload.file;
        //     res.write(`${file}\n`);
        //     fs.unlinkSync(file);
        // }
        // res.end();
        // @ts-ignore
        delete email.headers;
        // @ts-ignore
        let envelope = JSON.parse(email.envelope);
        // @ts-ignore
        delete email.envelope;
        // @ts-ignore
        delete email.html;
        email = {...email, ...envelope};

        await sendActivityNotification(`got inbound email \n\n \`\`\`${JSON.stringify(email, null, 2)}\`\`\``)
        res.send(email);
    });

    // The raw bytes of the upload will be in req.rawBody.  Send it to busboy, and get
    // a callback when it's finished.


    busboy.end(req.rawBody || req.body);



});


export default app;