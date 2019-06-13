import AttachmentInfo from "@api/inbound/models/EmailAttachment"
import * as parseEmail from "email-addresses";
import ParsedMailbox = emailAddresses.ParsedMailbox;
import EmailAddress from "@api/inbound/models/EmailAddress";
import EmailHeaders, {MailchimpMemberId} from "@api/inbound/models/EmailHeaders";




export interface InboundEmailFiles {
    [fieldName: string]: {
        [filename: string]: string
    }
}

export interface InboundEmail {
    headers?: EmailHeaders;
    toRaw?: string;
    fromRaw?: string;
    ccRaw?: string;
    text?: string;
    html?: string;
    subject?: string;
    envelope?: {to: string[], from: string}
    attachments?: Array<AttachmentInfo>;
    mailchimpEmailId?: string;
    mailchimpCampaignId?:string;

}

export default class Email implements Email{
    headers: EmailHeaders;
    to?: EmailAddress;
    cc?: EmailAddress;
    from?: EmailAddress;
    envelope?: {to: EmailAddress[], from: EmailAddress};
    replyText?: string;
    text?: string;
    html?: string;
    subject?: string;
    attachments?: Array<AttachmentInfo>;
    mailchimpMemberId?: string|undefined|null;
    mailchimpUniqueEmailId?: string|undefined|null;
    mailchimpCampaignId?:string;

    constructor(input:InboundEmail){
        this.headers = input.headers || {};
        this.attachments = input.attachments || [];
        this.text = input.text;
        this.html = input.html;
        this.subject = input.subject;
        this.mailchimpMemberId = this.headers[MailchimpMemberId];
        this.mailchimpUniqueEmailId = input.mailchimpEmailId;
        this.mailchimpCampaignId = input.mailchimpCampaignId;

        if (input.fromRaw){
            const fromParsed = parseEmail.parseOneAddress(input.fromRaw) as ParsedMailbox;
            this.from = {
                email: fromParsed.address,
                name: fromParsed.name,
                local: fromParsed.local,
                domain: fromParsed.domain
            }
        }

        if (input.toRaw){
            const toParsed = parseEmail.parseOneAddress(input.toRaw) as ParsedMailbox;
            this.to = {
                email: toParsed.address,
                name: toParsed.name,
                local: toParsed.local,
                domain: toParsed.domain
            }
        }
        if (input.ccRaw){
            const ccParsed = parseEmail.parseOneAddress(input.ccRaw) as ParsedMailbox;
            this.cc = {
                email: ccParsed.address,
                name: ccParsed.name,
                local: ccParsed.local,
                domain: ccParsed.domain
            }
        }

        if (input.envelope){
            const env = input.envelope;

            const parsedFrom = parseEmail.parseOneAddress(env.from) as ParsedMailbox;

            const envTo = !env.to ? [] : env.to.map(raw => {
                const parsed = parseEmail.parseOneAddress(raw) as ParsedMailbox;
                return  {
                    email: parsed.address,
                    name: parsed.name,
                    local: parsed.local,
                    domain: parsed.domain
                }
            });

            this.envelope = {
                to: envTo,
                from:  {
                    email: parsedFrom.address,
                    name: parsedFrom.name,
                    local: parsedFrom.local,
                    domain: parsedFrom.domain
                },
            };
        }

    }
}