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
    text?: string;
    html?: string;
    subject?: string;
    attachments?: Array<AttachmentInfo>;

}

export default class Email implements Email{
    headers: EmailHeaders;
    to?: EmailAddress;
    from?: EmailAddress;
    text?: string;
    html?: string;
    subject?: string;
    attachments?: Array<AttachmentInfo>;
    mailchimpMemberId?: string|undefined|null;

    constructor(input:InboundEmail){
        this.headers = input.headers || {};
        this.attachments = input.attachments || [];
        this.text = input.text;
        this.html = input.html;
        this.subject = input.subject;
        this.mailchimpMemberId = this.headers[MailchimpMemberId];
        
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
    }
}