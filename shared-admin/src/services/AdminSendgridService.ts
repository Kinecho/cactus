import {CactusConfig} from "@shared/CactusConfig";
import * as sgMail from "@sendgrid/mail";
import {MagicLinkEmail, 
        InvitationEmail, 
        FriendRequestEmail} from "@admin/services/SendgridServiceTypes";
import Logger from "@shared/Logger";

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

    async sendMagicLink(options: MagicLinkEmail): Promise<boolean> {

        // SgHelpers.classes.Mail.MailData

        try {
            const params = {
                to: options.email,
                from: {name: "Cactus", email: "help@cactus.app"},
                templateId: this.config.sendgrid.template_ids.magic_link,
                categories: ["Authentication"],
                dynamicTemplateData: {
                    link: options.link,
                    displayName: options.displayName,
                }
            };
            logger.log("Sending magic link email with params", params);
            await sgMail.send(params);

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

        // SgHelpers.classes.Mail.MailData

        try {
            const mailParams = {
                to: options.email,
                from: {name: "Cactus", email: "help@cactus.app"},
                templateId: this.config.sendgrid.template_ids.magic_link_new_user,
                categories: ["Confirm Email"],
                dynamicTemplateData: {
                    link: options.link,
                    displayName: options.displayName,
                }
            };

            logger.log("Sending email with params", JSON.stringify(mailParams, null, 2));

            await sgMail.send(mailParams);

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
                templateId: this.config.sendgrid.template_ids.invitation,
                categories: ["Invitation"],
                dynamicTemplateData: {
                    name: options.fromName,
                    email: options.fromEmail,
                    link: options.link,
                    message: options.message
                }
            };

            logger.log("Sending email with params", JSON.stringify(mailParams, null, 2));

            await sgMail.send(mailParams);

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
                categories: ["FriendRequest"],
                dynamicTemplateData: {
                    name: options.fromName,
                    email: options.fromEmail,
                    link: options.link
                }
            };

            logger.log("Sending email with params", JSON.stringify(mailParams, null, 2));

            await sgMail.send(mailParams);

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


}