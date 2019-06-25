import AttachmentInfo from "@shared/models/EmailAttachment"
import * as parseEmail from "email-addresses";
import ParsedMailbox = emailAddresses.ParsedMailbox;
import EmailAddress from "@shared/EmailAddress";
import EmailHeaders, {MailchimpMemberId} from "@shared/models/EmailHeaders";
import {BaseModel, Collection} from "@shared/FirestoreBaseModels";

export enum EmailStoragePath {
    HEADERS = "HEADERS",
    BODY = "BODY",
}

export interface InboundEmailFiles {
    [fieldName: string]: {
        [filename: string]: string
    }
}

export type EmailStorageFiles = {
    [key in EmailStoragePath]: string|null;
};

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

export default class EmailReply extends BaseModel{
    collection = Collection.emailReply;

    headers: EmailHeaders = {};
    to: EmailAddress = {};
    cc: EmailAddress = {};
    from: EmailAddress = {};
    envelope?: {to: EmailAddress[], from: EmailAddress};
    replyText?: string;
    content: {
        text?: string;
        html?: string;
    } = {};
    subject?: string;
    attachments?: Array<AttachmentInfo>;
    mailchimpMemberId?: string;
    mailchimpUniqueEmailId?: string;
    mailchimpCampaignId?:string;
    originalEmailStoragePaths: EmailStorageFiles = {HEADERS: null, BODY: null};
    reflectionPromptId?: string;
    //models need an empty constructor
    constructor(input:InboundEmail|undefined=undefined){
        super();

        if (!input) {
            return;
        }

        this.headers = input.headers || {};
        this.attachments = input.attachments || [];
        this.content = {
            text: input.text,
            html: input.html,
        };
        this.subject = input.subject;
        this.mailchimpMemberId = this.headers[MailchimpMemberId] || undefined;
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

    setStoragePath(type: EmailStoragePath, path: string|null|boolean){
        if (path && path !== true){
            this.originalEmailStoragePaths[type] = path;
        }
    }
}