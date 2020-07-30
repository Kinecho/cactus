import EmailReply, {InboundEmail, InboundEmailFiles} from "@shared/models/EmailReply";
import {inspect} from "util";
import {InboundAttachmentInfo, InboundEmailAttachments} from "@shared/models/EmailAttachment";
import {splitOnFirst} from "@admin/util/StringUtil";
import EmailHeaders, {Header} from "@shared/models/EmailHeaders";
import * as Busboy from "busboy";
import Logger from "@shared/Logger";

const logger = new Logger("EmailProcessor");
const path = require("path");
const os = require("os");
const fs = require("fs");
const getUrls = require('get-urls');
const queryString = require('query-string');
const replyParser = require("node-email-reply-parser");

const MAILCHIMP_USER_EMAIL_PARAM = "e";
const CAMPAIGN_PARAM = "c";

export const forwardedGmailEmail = "hello+caf_=forwarded=inbound.cactus.app@kinecho.com";

export async function processEmail(headers:any, body:any):Promise<EmailReply|null> {
    return new Promise(async (resolve, reject) => {
        try {

            const busboy = new Busboy({headers: headers});
            const emailFiles: InboundEmailFiles = {};
            const emailInput: InboundEmail = {};

            busboy.on("error", (error: any) => {
                logger.error("failed to process something", error);
            });

            busboy.on("file", getFileHandler(emailFiles));
            busboy.on('field', getFieldHandler(emailInput));

            // This callback will be invoked after all uploaded files are saved.
            busboy.on('finish', async () => {
                const email = await createEmailFromInputs(emailInput, emailFiles);


                email.replyText = getReplyTextContent(email);

                resolve(email);
                return;
            });

            // The raw bytes of the upload will be in req.rawBody.  Send it to busboy, and get
            // a callback when it's finished.
            // const body = req.rawBody || req.body;
            try {
                const mailchimpUniqueId = getMailchimpEmailIdFromBody(String(body));
                logger.log("raw body mailchimp email id", mailchimpUniqueId);
                emailInput.mailchimpEmailId = mailchimpUniqueId;
            } catch (error){
                logger.error("failed to get mailchimp email id from raw body", error);
            }

            try {
                const campaignId = getMailchimpCampaignIdFromBody(String(body));
                logger.log("raw body mailchimp campaign id", campaignId);
                emailInput.mailchimpCampaignId = campaignId;
            } catch (error){
                logger.error("failed to get mailchimp campaign id from raw body", error);
            }

            //this is the method that actually passes in the body to the busboy processor
            busboy.end(body);
        } catch (error) {
            logger.error("failed to process email", error);
            reject(error);
            return;
        }
    })
}


export async function createEmailFromInputs(emailInput: InboundEmail, fileInput: InboundEmailFiles): Promise<EmailReply> {
    return new EmailReply(emailInput);
}

/**
 *
 * @param {InboundEmail} emailFiles
 * @return {(fieldname: string, file: NodeJS.ReadableStream, filename: string, encoding: string, mimetype: string) => void}
 */
export function getFileHandler(emailFiles: InboundEmailFiles) {
    logger.log("getting file handler for email input");
    return (fieldname: string,
            file: NodeJS.ReadableStream,
            filename: string,
            encoding: string,
            mimetype: string) => {

        file.on("error", (error: any) => {
            logger.error("failed to process file", error);

        });

        logger.log(`File [${fieldname}] filename: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`);
        // Note that os.tmpdir() is an in-memory file system, so should only
        // be used for files small enough to fit in memory.
        const filepath = path.join(os.tmpdir(), fieldname);

        emailFiles[fieldname] = {file: filepath};
        logger.log(`Saving '${fieldname}' to ${filepath}`);
        file.pipe(fs.createWriteStream(filepath));
    }

}


export function getFieldHandler(email: InboundEmail) {
    logger.log("field handler for email", email);
    return function (fieldname: string,
                     val: any,
                     fieldnameTruncated: boolean,
                     valTruncated: boolean,
                     encoding: string,
                     mimetype: string) {

        // logger.log('Field [' + fieldname + ']: value: ' + inspect(val));

        switch (fieldname) {
            case 'headers':
                email.headers = processBodyHeaders(val);
                break;
            case "dkim":
                break;
            case "html":
                email.html = val;
                if (!email.mailchimpEmailId){
                    email.mailchimpEmailId = getMailchimpEmailIdFromBody(val);
                    logger.log("processing html, found mailchimpEmailId", email.mailchimpEmailId);
                }
                break;
            case "to":
                email.toRaw = val;
                break;
            case "from":
                email.fromRaw = val;
                break;
            case "cc":
                email.ccRaw = val;
                break;
            case "text":
                email.text = val;
                break;
            case "sender_ip":
                break;
            case "envelope":
                // logger.log("ENVELOPE: ", val);
                try {
                    email.envelope = JSON.parse(val);
                } catch (e) {
                    logger.error(`Unable to process the envelope field ${val}`, e);
                }

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
                logger.warn("field name [", fieldname, "] not handled");
                break;
        }
    }
}

export function processBodyHeaders(input: string): EmailHeaders {
    const lines = input.split("\n");

    const aggregated = lines.reduce((headers, line: string) => {
        const [key, value] = splitOnFirst(line, ":");
        if (key) {
            headers[key] = value;
        }

        return headers;
    }, {} as EmailHeaders);

    // logger.log("processed headers into", aggregated);
    return aggregated
}

export function getSenderFromHeaders(headers: EmailHeaders): string | null {
    try {
        const header = headers[Header.AUTHENTICATION_RESULTS];
        if (!header) {
            return null;
        }

        let [, mailfrom] = header.split("smtp.mailfrom=");
        if (!mailfrom) {
            return null;
        }

        [mailfrom] = mailfrom.split(new RegExp(/\s*(;|\s)/));

        return mailfrom ? mailfrom.trim().toLowerCase() : null;
    } catch (error) {
        logger.error("error processing sender headers", error);
        return null;
    }

}

export function processAttachments(input: InboundEmailAttachments): Array<InboundAttachmentInfo> {
    try {
        logger.log("processing attachments");
        inspect(input);
        return Object.values(input)
    } catch (error) {
        logger.error("failed to parse attachments", error);
        return [];
    }
}


export function getLinks(body:string, removeNewline:boolean=false):Set<string>{
    let parsedBody = body.replace(/&amp;/g, "&");

    if (removeNewline) {
        parsedBody = parsedBody.replace(/\n/g, "");
    }
    return getUrls(parsedBody, {sortQueryParameters: false});
}

export function getMailchimpEmailIdFromBody(body:string):string|undefined{
    return getUrlParamFromString(body, MAILCHIMP_USER_EMAIL_PARAM);
}


export function getMailchimpCampaignIdFromBody(body:string):string|undefined{
    return getUrlParamFromString(body, CAMPAIGN_PARAM);
}


export function getReplyTextContent(email:EmailReply):string {
    try {
        const parsedBody = replyParser(email.content.text);
        const visibleText = parsedBody.getVisibleText() || "";
        return visibleText.trim();
    } catch (error){
        logger.error("failed to process reply", error);
        return "";
    }

}

function getUrlParamFromString(body:string, param:string, {acceptedDomains=["list-manage.com"], removeNewlineInBody=false}={}):string|undefined{
    const u = getLinks(body, removeNewlineInBody);
    if (!u){
        return undefined;
    }

    const urls = Array.from(u);

    let mailchimpParam:string|undefined = undefined;
    urls.find(url => {

        const acceptedDomain = acceptedDomains.find(domain => url.toLowerCase().includes(domain.toLowerCase()));

        if (!acceptedDomain){
            return false;
        }

        const {query} = queryString.parseUrl(url);
        if (query && query[param]){
            mailchimpParam = query[param];
            mailchimpParam = (mailchimpParam || "").replace(/[^a-zA-Z0-9 -]/, "");
            return true
        }
        return false;
    });

    if ((mailchimpParam === undefined || mailchimpParam === null) && !removeNewlineInBody){
        return getUrlParamFromString(body, param, {acceptedDomains, removeNewlineInBody: true})
    }

    return mailchimpParam;

}