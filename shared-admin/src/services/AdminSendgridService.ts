import { CactusConfig } from "@admin/CactusConfig";
import * as sgMail from "@sendgrid/mail";
import * as EmailAddressTypes from "@sendgrid/helpers/classes/email-address";
import * as MailTypes from "@sendgrid/helpers/classes/mail"
import _axios, { AxiosInstance } from "axios";
import {
    AdvancedSubscriptionManagementEvent,
    FriendRequestEmail,
    InvitationEmail,
    isAdvancedSubscriptionManagementEvent,
    MagicLinkEmail,
    PromptNotificationEmail,
    SendgridEventType,
    SendgridWebhookEvent,
    TrialEndingEmail,
    WebhookEventResult
} from "@admin/services/SendgridServiceTypes";
import Logger from "@shared/Logger";
import EmailLog, { EmailCategory, SendgridTemplate, TemplateData, TemplateName } from "@shared/models/EmailLog";
import AdminEmailLogService from "@admin/services/AdminEmailLogService";
import { isArray, isNumber, isString, stringifyJSON } from "@shared/util/ObjectUtil";
import { isGeneratedEmailAddress } from "@admin/util/StringUtil";
import { isBlank } from "@shared/util/StringUtil";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import AdminSlackService from "@admin/services/AdminSlackService";
import { getAxiosError } from "@shared/api/ApiTypes";
import MailchimpService from "@admin/services/MailchimpService";
import { ListMemberStatus } from "@shared/mailchimp/models/MailchimpTypes";
export import EmailData = EmailAddressTypes.EmailData;
export import ASMOptions = MailTypes.ASMOptions;
export import MailDataRequired = MailTypes.MailDataRequired;

export const SendgridHeaders = {
    MessageID: "x-message-id"
};

export interface SendEmailResult {
    emailLog?: EmailLog,
    didSend: boolean,
    error?: any,
}

type SenderAddress = { name: string, email: string };
export const CactusSender = {
    RYAN: { name: "Ryan at Cactus", email: "ryan@cactus.app" },
    SUPPORT: { name: "Cactus Support", email: "support@cactus.app" },
    HELLO: { name: "Cactus", email: "hello@cactus.app" },
};


export const Helpers = {
    getEmailAddressFromEmailData(data?: EmailData | EmailData[]): string | undefined {
        if (!data) {
            return undefined;
        }
        if (isString(data)) {
            return data;
        }
        if (isArray(data)) {
            const [first] = (data as EmailData[]);
            if (!isString(first)) {
                return first.email
            } else {
                return first;
            }
        } else {
            const d = data as EmailData;
            if (!isString(d)) {
                return d.email;
            }
        }
        return undefined;
    }

}

interface SendTemplateOptions {
    email: string,
    memberId?: string,
    data: TemplateData,
    template: SendgridTemplate,
    categories?: EmailCategory[],
    sender: SenderAddress,
    oneTime: boolean
}

const logger = new Logger("AdminSendgridService");
export default class AdminSendgridService {
    apiKey: string;
    config: CactusConfig;
    api: AxiosInstance;
    apiDomain = "https://api.sendgrid.com/v3";

    protected static sharedInstance: AdminSendgridService;

    static initialize(config: CactusConfig) {
        logger.log("initializing SendGrid service");
        AdminSendgridService.sharedInstance = new AdminSendgridService(config);
    }

    static getSharedInstance() {
        if (AdminSendgridService.sharedInstance) {
            return AdminSendgridService.sharedInstance;
        }
        throw new Error("You must initialize mailchimp service before calling getSharedInstance()");
    }


    constructor(config: CactusConfig) {
        this.apiKey = config.sendgrid.api_key;
        this.config = config;
        sgMail.setApiKey(this.apiKey);
        this.api = _axios.create({
            baseURL: this.apiDomain,
            headers: {
                'Authorization': `Bearer ${ this.apiKey }`,
                "Content-Type": "application/json",
            }
        });
    }

    getSendgridTemplateId(templateName: SendgridTemplate): string {
        return this.config.sendgrid.templates[templateName].template_id;
    }

    getUnsubscribeGroupId(templateName: SendgridTemplate): number | undefined {
        const value = this.config.sendgrid.templates[templateName].unsubscribe_group_id;
        if (!isBlank(value)) {
            const num = Number(value);
            if (isNumber(num)) {
                return num
            }
        }
        return undefined;
    }

    getUnsubscribeGroupsToDisplay(templateName: SendgridTemplate): number[] | undefined {
        const allGroups: number[] = []
        Object.values(this.config.sendgrid.templates).forEach(t => {
            if (isBlank(t.unsubscribe_group_id)) {
                return;
            }
            const groupNumber = Number(t.unsubscribe_group_id);
            if (groupNumber && isNumber(groupNumber)) {
                allGroups.push(groupNumber);
            }
        })
        return allGroups;
    }

    async sendMail(mailParams: MailDataRequired) {
        const toAddress = Helpers.getEmailAddressFromEmailData(mailParams.to);
        if (!isGeneratedEmailAddress(toAddress)) {
            return await sgMail.send(mailParams);
        } else {
            return;
        }
    }

    async sendMagicLink(options: MagicLinkEmail): Promise<boolean> {
        try {
            const params = {
                to: options.email,
                from: { name: "Cactus", email: "help@cactus.app" },
                templateId: this.getSendgridTemplateId(SendgridTemplate.magic_link),
                categories: [EmailCategory.Authentication],
                dynamicTemplateData: {
                    link: options.link,
                    displayName: options.displayName,
                }
            };
            logger.log("Sending magic link email with params", params);
            await this.sendMail(params);

            logger.log("Sendgrid email sent successfully");
            return true
        } catch (error) {
            if (error.response && error.response.body) {
                logger.error("Failed to send Magic Link email", error.response.body);
            } else {
                logger.error("Failed to send Magic Link email", error);
            }
            return false;
        }

    }

    async sendMagicLinkNewUser(options: MagicLinkEmail): Promise<boolean> {

        try {
            const mailParams = {
                to: options.email,
                from: { name: "Cactus", email: "help@cactus.app" },
                templateId: this.getSendgridTemplateId(SendgridTemplate.magic_link_new_user),
                categories: [EmailCategory.ConfirmEmail],
                dynamicTemplateData: {
                    link: options.link,
                    displayName: options.displayName,
                }
            };

            logger.log("Sending email with params", JSON.stringify(mailParams, null, 2));

            await this.sendMail(mailParams);

            logger.log("Sendgrid email sent successfully");
            return true;

        } catch (error) {
            if (error.response && error.response.body) {
                logger.error("Failed to send Magic Link New User email", error.response.body);
            } else {
                logger.error("Failed to send Magic Link New User email", error);
            }
            return false;
        }
    }

    async sendInvitation(options: InvitationEmail): Promise<boolean> {
        try {
            const mailParams = {
                to: options.toEmail,
                from: { name: "Cactus", email: "help@cactus.app" },
                templateId: this.getSendgridTemplateId(SendgridTemplate.invitation),
                categories: [EmailCategory.Invitation],
                dynamicTemplateData: {
                    name: options.fromName,
                    email: options.fromEmail,
                    link: options.link,
                    message: options.message
                }
            };

            logger.log("Sending email with params", JSON.stringify(mailParams, null, 2));

            await this.sendMail(mailParams);

            logger.log("Sendgrid email sent successfully");
            return true;

        } catch (error) {
            if (error.response && error.response.body) {
                logger.error("Failed to send Invitation email", error.response.body);
            } else {
                logger.error("Failed to send Invitation email", error);
            }
            return false;
        }

    }

    async sendFriendRequest(options: FriendRequestEmail): Promise<boolean> {

        try {
            const templateId = this.getSendgridTemplateId(SendgridTemplate.friend_request);
            const mailParams = {
                to: options.toEmail,
                from: { name: "Cactus", email: "help@cactus.app" },
                templateId: templateId,
                categories: [EmailCategory.FriendRequest],
                dynamicTemplateData: {
                    name: options.fromName,
                    email: options.fromEmail,
                    link: options.link
                }
            };

            logger.log("Sending email with params", JSON.stringify(mailParams, null, 2));

            await this.sendMail(mailParams);

            logger.log("Sendgrid email sent successfully");
            return true;

        } catch (error) {
            if (error.response && error.response.body) {
                logger.error("Failed to send Invitation email", error.response.body);
            } else {
                logger.error("Failed to send Invitation email", error);
            }
            return false;
        }

    }

    /**
     * Send a trial ending email notification to a member. This email will only ever be sent once.
     * This method manages the duplicate-send protection logic.
     *
     * @param {TrialEndingEmail} options
     * @return {Promise<boolean>}
     */
    async sendTrialEnding(options: TrialEndingEmail): Promise<SendEmailResult> {

        const sendResult = await this.sendTemplateAndLog({
            email: options.toEmail,
            sender: CactusSender.RYAN,
            template: SendgridTemplate.trial_ending,
            oneTime: true,
            memberId: options.memberId,
            categories: [EmailCategory.TrialEnding],
            data: {
                firstName: options.firstName,
                link: options.link,
            }

        });
        logger.info("email log", sendResult);

        return sendResult;
    }

    async sendPromptNotification(params: PromptNotificationEmail): Promise<SendEmailResult> {
        const { memberId, email } = params;
        const template: SendTemplateOptions = {
            template: SendgridTemplate.new_prompt_notification,
            data: params,
            email,
            sender: CactusSender.HELLO,
            memberId,
            categories: [EmailCategory.PROMPT_NOTIFICATION],
            oneTime: false, //TODO: make this more flexible, based on a provided "notification key"
        }

        const result = await this.sendTemplateAndLog(template);
        logger.info("Sent prompt notification email", result);
        return result;
    }

    getAdvancedSubscriptionConfiguration(templateName: TemplateName): ASMOptions | undefined {
        const groupId = this.getUnsubscribeGroupId(templateName);
        const displayIds = this.getUnsubscribeGroupsToDisplay(templateName)

        if (groupId) {
            return {
                groupId,
                groupsToDisplay: displayIds,
            }
        }

        return undefined;
    }

    async sendTemplateAndLog(options: SendTemplateOptions): Promise<SendEmailResult> {
        const { email, memberId, template, categories, sender, data, oneTime } = options;
        const templateId = this.getSendgridTemplateId(template);
        const asm = this.getAdvancedSubscriptionConfiguration(template);

        if (oneTime) {
            const [firstResult] = await AdminEmailLogService.getSharedInstance().search({
                email,
                memberId,
                templateName: template,
                sendgridTemplateId: templateId,
            });

            if (firstResult) {
                logger.info("This email has already been sent to the member. Not sending again", stringifyJSON(firstResult, 2));
                return { emailLog: firstResult, didSend: false };
            }
        }

        const mailParams: MailDataRequired = {
            to: email,
            from: sender,
            templateId,
            categories: options.categories,
            dynamicTemplateData: data,
            asm,
        };

        logger.log("Sending email with params", JSON.stringify(mailParams, null, 2));

        try {
            const toAddress = Helpers.getEmailAddressFromEmailData(mailParams.to);
            if (isGeneratedEmailAddress(toAddress)) {
                return { didSend: false };
            }

            const _response = await this.sendMail(mailParams);
            let response;
            if (Array.isArray(_response)) {
                const [firstResponse] = _response;
                response = firstResponse;
            } else {
                response = _response;
            }

            const xMessageId = (response?.headers[SendgridHeaders.MessageID]) as string | undefined;
            logger.log(`Sendgrid email sent successfully. MessageId = ${ xMessageId }. TemplateData:\n ${ stringifyJSON(data, 2) }`,);

            const log = EmailLog.sendgridTemplate({
                email,
                memberId,
                xMessageId: xMessageId,
                templateName: template,
                templateId: templateId,
                categories,
                templateData: data,
            });

            await AdminEmailLogService.getSharedInstance().save(log);
            logger.info("Saved email log to database", stringifyJSON(log));
            return { emailLog: log, didSend: true };
        } catch (error) {
            const e = error.response?.body ?? error;
            logger.error("Failed to send email", e);
            return { error: e, didSend: false };
        }
    }

    async updateNewPromptNotificationPreference(email: string, isSubscribed: boolean): Promise<{ success: boolean }> {
        try {
            const unsubscribeGroupId = Number(this.config.sendgrid.templates.new_prompt_notification.unsubscribe_group_id);
            if (!unsubscribeGroupId) {
                logger.info("No unsubscribe group could be found. Not unsubscribing user", email);
                return { success: true };
            }
            if (isSubscribed) {
                logger.info(`Attempting to remove (re-subscribe) ${ email } from groupId ${ unsubscribeGroupId }`);
                await this.api.delete(`asm/groups/${ unsubscribeGroupId }/suppressions/${ email }`)
            } else {
                logger.info(`Attempting to add (unsubscbribe) ${ email } to groupId ${ unsubscribeGroupId }`);
                await this.api.post(`asm/groups/${ unsubscribeGroupId }/suppressions`, {
                    recipient_emails: [email]
                })
            }

            return { success: true };
        } catch (error) {
            logger.error("Failed to unsubscribe user from emails", getAxiosError(error));
            return { success: false }
        }
    }


    async handleWebhookEvent(event: SendgridWebhookEvent): Promise<WebhookEventResult> {
        logger.info("Handling webhook event", event);
        if (isAdvancedSubscriptionManagementEvent(event)) {
            return await this.handleSubscriptionManagementEvent(event);
        } else {
            logger.info("Not handling event type", event.event);
        }

        return { success: true, event: event.event };
    }

    getTemplateNameFromAsmGroupId(groupId: number): SendgridTemplate | undefined {
        const groupIdString = String(groupId);
        return (Object.keys(this.config.sendgrid.templates) as SendgridTemplate[]).find((name: SendgridTemplate) => {
            return groupIdString === this.config.sendgrid.templates[name].unsubscribe_group_id;
        })
    }

    async handleSubscriptionManagementEvent(event: AdvancedSubscriptionManagementEvent): Promise<WebhookEventResult> {
        const groupId = event.asm_group_id;
        const templateName = this.getTemplateNameFromAsmGroupId(groupId);
        const { email } = event;
        if (!templateName) {
            logger.info("No template found for given unsubscribe group. Can not process. Returning success.")
            return { success: true, event: event.event };
        }

        const isSubscribed = event.event === SendgridEventType.group_resubscribe;

        let success = true;
        switch (templateName) {
            case SendgridTemplate.new_prompt_notification:
                const member = await AdminCactusMemberService.getSharedInstance().setEmailNotificationPreference(event.email, isSubscribed);

                const mcStatus = isSubscribed ? ListMemberStatus.subscribed : ListMemberStatus.unsubscribed;
                const mailchimpResponse = await MailchimpService.getSharedInstance().updateMemberStatus({
                    status: mcStatus,
                    email
                });

                logger.info("MailChimp sync status result:", stringifyJSON(mailchimpResponse, 2));

                if (member) {
                    await AdminSlackService.getSharedInstance().sendActivityMessage(`${ member.email } has ${ isSubscribed ? "re-subscribed" : "unsubscribed" } from email notifications via sendgrid. Synced with Mailchimp success = ${ mailchimpResponse.success }.`);
                }

                logger.info("Updated member to have email notification prefernece of true");
                success = true;
                break;
            default:
                logger.info(`Not processing ${ event.event } for email template name ${ templateName }`);
                break;
        }

        return { success, event: event.event };
    }


}