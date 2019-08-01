import {CactusConfig} from "@shared/CactusConfig";
import * as sgMail from "@sendgrid/mail";
import {MagicLinkEmail} from "@shared/services/SendgridServiceTypes";

// declare type MailService = sgMail.MailService;

export default class AdminSendgridService {
    apiKey: string;
    config:CactusConfig;

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

    async sendMagicLink(options: MagicLinkEmail): Promise<void> {

        // SgHelpers.classes.Mail.MailData

        try {
            await sgMail.send({
                to: options.email,
                from: {name: "Cactus", email: "support@cactus.app"},
                templateId: this.config.sendgrid.template_ids.magic_link,
                categories: ["Authentication"],
                dynamicTemplateData: {

                    subject: "Your Magic Sign In Link from Cactus",
                    link: options.link,
                    displayName: options.displayName,
                }
            });

            console.log("Sendgrid email sent successfully");

        } catch (error){
            console.error("Failed to send Magic Link email", error);
        }

        return;
    }


}