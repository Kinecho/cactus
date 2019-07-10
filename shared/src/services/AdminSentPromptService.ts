import AdminFirestoreService from "@shared/services/AdminFirestoreService";
import SentPrompt, {PromptSendMedium} from "@shared/models/SentPrompt";
import {SentToRecipient} from "@shared/mailchimp/models/MailchimpTypes";
import MailchimpService from "@shared/services/MailchimpService";
import AdminReflectionPromptService from "@shared/services/AdminReflectionPromptService";
import {Collection} from "@shared/FirestoreBaseModels";
import AdminCactusMemberService from "@shared/services/AdminCactusMemberService";
import {sendEngineeringMessage} from "../../../functions/src/slack/slack";


export interface CampaignSentPromptProcessingResult {
    sentPrompt?: SentPrompt,
    recipient: SentToRecipient,
}

export default class AdminSentPromptService {
    static sharedInstance: AdminSentPromptService = new AdminSentPromptService();
    firestoreService: AdminFirestoreService = AdminFirestoreService.getSharedInstance();
    mailchimpService = MailchimpService.getSharedInstance();
    reflectionPromptService = AdminReflectionPromptService.sharedInstance;
    cactusMemberService = AdminCactusMemberService.getSharedInstance();


    getCollectionRef() {
        return this.firestoreService.getCollectionRef(Collection.sentPrompts);
    }

    async getFirst(query: FirebaseFirestore.Query): Promise<SentPrompt | undefined> {
        return await this.firestoreService.getFirst(query, SentPrompt);
    }

    async save(model: SentPrompt): Promise<SentPrompt> {
        return this.firestoreService.save(model);
    }

    async getById(id: string): Promise<SentPrompt | undefined> {
        return await this.firestoreService.getById(id, SentPrompt);
    }


    async getSentPromptForCactusMemberId(options: { cactusMemberId: string, promptId: string }): Promise<SentPrompt | undefined> {

        const query = this.getCollectionRef().where(SentPrompt.Fields.promptId, "==", options.promptId)
            .where(SentPrompt.Fields.cactusMemberId, "==", options.cactusMemberId);

        return await this.getFirst(query);
    }

    // async getByCampaignId
    async processMailchimpRecipient(recipient: SentToRecipient, promptId: string): Promise<SentPrompt | undefined> {
        let member = await this.cactusMemberService.getMemberByEmail(recipient.email_address);

        if (!member) {
            console.warn("Unable to find an existing cactus member for the provided email... creating them now");
            const profileMember = await this.mailchimpService.getMemberByEmail(recipient.email_address);
            if (!profileMember) {
                console.error("Couldn't get a profile member from mailchimp for email", recipient.email_address);
                await sendEngineeringMessage(`:warning: Processing Mailchimp Campaign Recipient: Unable to get a cactus member or mailchimp member for email address ${emailAddresses}`);
                return;
            } else {
                member = await this.cactusMemberService.updateFromMailchimpListMember(profileMember);
            }

        }

        if (!member || !member.id) {
            console.warn("Unable to get cactus member. Can't process email recipient for " + recipient.email_address);
            return;
        }


        let sentPrompt = await this.getSentPromptForCactusMemberId({cactusMemberId: member.id, promptId});
        if (sentPrompt) {
            // we don't want to push more events to this user,
            // because of automation processing we can have lots of duplicates.
            // If we can find a solution to figuring out if a sent was already logged, handling for the automation case,
            // we can push history to these objects
            // API Docs: https://developer.mailchimp.com/documentation/mailchimp/reference/reports/sent-to/#read-get_reports_campaign_id_sent_to
            return sentPrompt
        }

        sentPrompt = new SentPrompt();
        sentPrompt.firstSentAt = new Date();
        sentPrompt.cactusMemberId = member.id;
        sentPrompt.userId = member.userId;
        sentPrompt.lastSentAt = new Date();
        sentPrompt.memberEmail = member.email;
        sentPrompt.sendHistory.push({
            sendDate: new Date(),
            email: recipient.email_address,
            medium: PromptSendMedium.EMAIL_MAILCHIMP,
            mailchimpCampaignId: recipient.campaign_id,
            mailchimpEmailStatus: recipient.status
        });

        return await this.save(sentPrompt);
    }


    async processSentMailchimpCampaign(options: { campaignId: string, promptId?: string }): Promise<CampaignSentPromptProcessingResult[]> {
        let promptId = options.promptId;
        const campaignId = options.campaignId;
        if (!options.promptId) {
            const prompt = await this.reflectionPromptService.getPromptForCampaignId(options.campaignId);
            promptId = prompt ? prompt.id : undefined;
        }

        if (!promptId) {
            console.warn(`No prompt ID found for the given campaign (${campaignId}). Can not process campaign to update SentPrompt record.`);
            return [];
        }
        const recipients = await this.mailchimpService.getAllSentTo(campaignId);

        const tasks: Promise<CampaignSentPromptProcessingResult>[] = recipients.map(recipient => {
            return new Promise<CampaignSentPromptProcessingResult>(async resolve => {
                const sentPrompt = await this.processMailchimpRecipient(recipient, promptId as string);
                resolve({sentPrompt, recipient});
            })
        });

        await sendEngineeringMessage(`Processing ${tasks.length} campaign recipients for campaignId=\`${campaignId}\` and reflectionPromptId=\`${promptId}\``);

        return await Promise.all(tasks);
    }
}