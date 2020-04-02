import {CactusConfig} from "@shared/CactusConfig";
import * as sgMail from "@sendgrid/mail";
import {
    FriendRequestEmail,
    InvitationEmail,
    MagicLinkEmail,
    TrialEndingEmail
} from "@admin/services/SendgridServiceTypes";
import Logger from "@shared/Logger";
import EmailLog, {EmailCategory, SendgridTemplate, TemplateData} from "@shared/models/EmailLog";
import AdminEmailLogService from "@admin/services/AdminEmailLogService";
import {stringifyJSON} from "@shared/util/ObjectUtil";
import {isGeneratedEmailAddress} from "@admin/util/StringUtil";

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
    RYAN: {name: "Ryan at Cactus", email: "ryan@cactus.app"},
    SUPPORT: {name: "Cactus Support", email: "support@cactus.app"},
};

interface SendTemplateOptions {
    email: string,
    memberId?: string,
    data: TemplateData,
    template: SendgridTemplate,
    categories?: EmailCategory[],
    sender: SenderAddress,
    oneTime: boolean
}

// declare type MailService = sgMail.MailService;
const logger = new Logger("AdminSendgridService");
export default class AdminSendgridService {
    apiKey: string;
    config: CactusConfig;

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
    }

    getSendgridTemplateId(templateName: SendgridTemplate): string {
        return this.config.sendgrid.template_ids[templateName];
    }

    async sendMail(mailParams: any) {
        const toAddress = mailParams?.to;
        if (!isGeneratedEmailAddress(toAddress)) {
            return await sgMail.send(mailParams);
        } else {
            throw new Error("Email address was generated and is not valid.");
        }
    }

    async sendMagicLink(options: MagicLinkEmail): Promise<boolean> {
        try {
            const params = {
                to: options.email,
                from: {name: "Cactus", email: "help@cactus.app"},
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
                from: {name: "Cactus", email: "help@cactus.app"},
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
                from: {name: "Cactus", email: "help@cactus.app"},
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
            const mailParams = {
                to: options.toEmail,
                from: {name: "Cactus", email: "help@cactus.app"},
                templateId: this.config.sendgrid.template_ids.friend_request,
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

    async sendTemplateAndLog(options: SendTemplateOptions): Promise<SendEmailResult> {
        const {email, memberId, template, categories, sender, data, oneTime} = options;

        const templateId = this.getSendgridTemplateId(template);

        if (oneTime) {
            const [firstResult] = await AdminEmailLogService.getSharedInstance().search({
                email,
                memberId,
                templateName: template,
                sendgridTemplateId: templateId,
            });

            if (firstResult) {
                logger.info("This email has already been sent to the member. Not sending again", stringifyJSON(firstResult, 2));
                return {emailLog: firstResult, didSend: false};
            }
        }

        const mailParams = {
            to: email,
            from: sender,
            templateId,
            categories: [EmailCategory.TrialEnding],
            dynamicTemplateData: data,
        };

        logger.log("Sending email with params", JSON.stringify(mailParams, null, 2));

        try {
            const _response = await this.sendMail(mailParams);
            let response;
            if (Array.isArray(_response)) {
                const [firstResponse] = _response;
                response = firstResponse;
            } else {
                response = _response;
            }

            const xMessageId = (response?.headers[SendgridHeaders.MessageID]) as string | undefined;
            logger.log(`Sendgrid email sent successfully. MessageId = ${xMessageId}. TemplateData:\n ${stringifyJSON(data, 2)}`,);

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
            return {emailLog: log, didSend: true};
        } catch (error) {
            const e = error.response?.body ?? error;
            logger.error("Failed to send TrialEnding email", e);
            return {error: e, didSend: false};
        }
    }
}