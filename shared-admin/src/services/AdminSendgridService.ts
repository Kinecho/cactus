import {CactusConfig} from "@shared/CactusConfig";
import * as sgMail from "@sendgrid/mail";
import {MagicLinkEmail, InvitationEmail} from "@admin/services/SendgridServiceTypes";

// declare type MailService = sgMail.MailService;

export default class AdminSendgridService {
    apiKey: string;
    config: CactusConfig;

    protected static sharedInstance: AdminSendgridService;

    static initialize(config: CactusConfig) {
        console.log("initializing SendGrid service");
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
            console.log("Sending magic link email with params", params);
            await sgMail.send(params);

            console.log("Sendgrid email sent successfully");
            return true
        } catch (error) {
            if (error.response && error.response.body) {
                console.error("Failed to send Magic Link email", error.response.body);
            } else {
                console.error("Failed to send Magic Link email", error);
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

            console.log("Sending email with params", JSON.stringify(mailParams, null, 2));

            await sgMail.send(mailParams);

            console.log("Sendgrid email sent successfully");
            return true;

        } catch (error) {
            if (error.response && error.response.body) {
                console.error("Failed to send Magic Link New User email", error.response.body);
            } else {
                console.error("Failed to send Magic Link New User email", error);
            }
            return false;
        }

    }


    async sendInvitation(options: InvitationEmail): Promise<boolean> {

        try {
            const mailParams = {
                to: options.to_email,
                from: {name: "Cactus", email: "help@cactus.app"},
                templateId: this.config.sendgrid.template_ids.invitation,
                categories: ["Invitation"],
                dynamicTemplateData: {
                    link: "",
                }
            };

            console.log("Sending email with params", JSON.stringify(mailParams, null, 2));

            await sgMail.send(mailParams);

            console.log("Sendgrid email sent successfully");
            return true;

        } catch (error) {
            if (error.response && error.response.body) {
                console.error("Failed to send Invitation email", error.response.body);
            } else {
                console.error("Failed to send Invitation email", error);
            }
            return false;
        }

    }


}