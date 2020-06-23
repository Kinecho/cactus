import {BaseModel, Collection} from "@shared/FirestoreBaseModels";

export enum EmailCategory {
    TrialEnding = "TrialEnding",
    FriendRequest = "FriendRequest",
    Invitation = "Invitation",
    ConfirmEmail = "Confirm Email",
    Authentication = "Authentication",
    PROMPT_NOTIFICATION = "Prompt Notification",
}

export enum SendgridTemplate {
    magic_link = "magic_link",
    magic_link_new_user = "magic_link_new_user",
    invitation = "invitation",
    friend_request = "friend_request",
    trial_ending = "trial_ending",
    data_export = "data_export",
    new_prompt_notification = "new_prompt_notification",
}

/**
 * Aggregation type for all templates.
 */
export type TemplateName = SendgridTemplate

export type TemplateData = { [name: string]: any };


enum Fields {
    memberId = "memberId",
    email = "email",
    templateName = "templateName",
    categories = "categories",
    sendgridTemplateId = "sendgridTemplateId",
    sendgridMessageId = "sendgridMessageId",
}

/**
 * @Deprecated - use NotificationLog instead
 */
export default class EmailLog extends BaseModel {
    static Fields = Fields;
    collection = Collection.emailLogs;
    sendgridTemplateId?: string;


    /**
     * The SendGrid assigned Message ID is different than an X-Message-ID given in response headers when sending via API.
     * While this ID is contained in the SendGrid assigned Message ID, the X-Message-ID is specific to the API request
     * prior to messages being broken up individually in SendGrid email servers and then assigned the SendGrid Message ID.
     * The SendGrid Message ID accounts not only for the original request but also server data and
     * the specific identification between a unique message and recipient.
     *
     * see [Sendgrid Docs](https://sendgrid.com)
     */
    sendgridXMessageId?: string;
    templateName?: string;
    categories?: EmailCategory[];
    memberId?: string;
    email!: string;
    templateData?: TemplateData;

    constructor(email?: string) {
        super();
        if (email) {
            this.email = email;
        }
    }

    static sendgridTemplate(options: {
        email: string,
        memberId?: string | undefined,
        templateId: string,
        templateName: TemplateName,
        categories?: EmailCategory[],
        templateData?: TemplateData,
        xMessageId?: string
    }): EmailLog {
        const log = new EmailLog(options.email);
        log.memberId = options.memberId;
        log.templateData = options.templateData;
        log.templateName = options.templateName;
        log.sendgridTemplateId = options.templateId;
        log.categories = options.categories;
        log.sendgridXMessageId = options.xMessageId;
        return log;
    }
}