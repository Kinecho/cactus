import Email, {InboundEmail, InboundEmailFiles} from "@api/inbound/models/Email";
import {inspect} from "util";

const path = require("path");
const os = require("os");
const fs = require("fs");
const getUrls = require('get-urls');
const queryString = require('query-string');

import {InboundAttachmentInfo, InboundEmailAttachments} from "@api/inbound/models/EmailAttachment";
import {splitOnFirst} from "@api/util/StringUtil";
import EmailHeaders, {Header} from "@api/inbound/models/EmailHeaders";
const MAILCHIMP_USER_EMAIL_PARAM = "e";
const CAMPAIGN_PARAM = "c";

export async function createEmailFromInputs(emailInput: InboundEmail, fileInput: InboundEmailFiles): Promise<Email> {
    // console.log();
    // console.log("email files", JSON.stringify(fileInput));
    // console.log();
    // console.log("Finished processing body. email input", JSON.stringify(emailInput, null, 2));


    const email = new Email(emailInput);
    // console.log("need to handle input files still. Files = ", inspect(fileInput));
    return email;
}

/**
 *
 * @param {InboundEmail} emailFiles
 * @return {(fieldname: string, file: NodeJS.ReadableStream, filename: string, encoding: string, mimetype: string) => void}
 */
export function getFileHandler(emailFiles: InboundEmailFiles) {
    console.log("getting file handler for email inpout");
    return (fieldname: string,
            file: NodeJS.ReadableStream,
            filename: string,
            encoding: string,
            mimetype: string) => {

        file.on("error", (error: any) => {
            console.error("failed to process file", error);

        });

        console.log(`File [${fieldname}] filename: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`);
        // Note that os.tmpdir() is an in-memory file system, so should only
        // be used for files small enough to fit in memory.
        const filepath = path.join(os.tmpdir(), fieldname);

        emailFiles[fieldname] = {file: filepath};
        console.log(`Saving '${fieldname}' to ${filepath}`);
        file.pipe(fs.createWriteStream(filepath));
    }

}


export function getFieldHandler(email: InboundEmail) {
    console.log("field handler for email", email);
    return function (fieldname: string,
                     val: any,
                     fieldnameTruncated: boolean,
                     valTruncated: boolean,
                     encoding: string,
                     mimetype: string) {

        // console.log('Field [' + fieldname + ']: value: ' + inspect(val));

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
                    console.log("processing html, found mailchimpEmailId", email.mailchimpEmailId);
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
                // console.log("ENVELOPE: ", val);
                try {
                    email.envelope = JSON.parse(val);
                } catch (e) {
                    console.error(`Unable to process the envelope field ${val}`, e);
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
                console.warn("field name [", fieldname, "] not handled");
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

    console.log("processed headers into", aggregated);
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
        console.error("error processing sender headers", error);
        return null;
    }

}

export function processAttachments(input: InboundEmailAttachments): Array<InboundAttachmentInfo> {
    try {
        console.log("processing attachments");
        inspect(input);
        return Object.values(input)
    } catch (error) {
        console.error("failed to parse attachments");
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


function getUrlParamFromString(body:string, param:string, {acceptedDomains=["list-manage.com"], removeNewlineInBody=false}={}):string|undefined{
    const u = getLinks(body, removeNewlineInBody);
    if (!u){
        return undefined;
    }

    const urls = Array.from(u);

    let mailchimpParam:string|undefined = undefined;
    const urlWithCampaignParam = urls.find(url => {

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

    console.log("url that has param is", urlWithCampaignParam);


    if ((mailchimpParam === undefined || mailchimpParam === null) && !removeNewlineInBody){
        return getUrlParamFromString(body, param, {acceptedDomains, removeNewlineInBody: true})
    }

    return mailchimpParam;

}