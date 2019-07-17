import AdminFirestoreService from "@shared/services/AdminFirestoreService";
import SentPrompt, {PromptSendMedium} from "@shared/models/SentPrompt";
import {SentToRecipient} from "@shared/mailchimp/models/MailchimpTypes";
import MailchimpService from "@shared/services/MailchimpService";
import AdminReflectionPromptService from "@shared/services/AdminReflectionPromptService";
import {Collection} from "@shared/FirestoreBaseModels";
import AdminCactusMemberService from "@shared/services/AdminCactusMemberService";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import {getDateFromISOString} from "@shared/util/DateUtil";


export interface CampaignSentPromptProcessingResult {
    sentPrompt?: SentPrompt,
    recipient?: SentToRecipient,
    error?: { message?: string, error?: any, campaignId?: string }
    warning?: { message?: string, campaignId?: string, promptId?: string }
}

let firestoreService: AdminFirestoreService;

export default class AdminSentPromptService {
    protected static sharedInstance: AdminSentPromptService;
    mailchimpService = MailchimpService.getSharedInstance();
    reflectionPromptService = AdminReflectionPromptService.getSharedInstance();
    cactusMemberService = AdminCactusMemberService.getSharedInstance();


    static getSharedInstance(): AdminSentPromptService {
        if (!AdminSentPromptService.sharedInstance) {
            throw new Error("No shared instance available. Be sure to call initialize before using it");
        }
        return AdminSentPromptService.sharedInstance;
    }

    static initialize() {
        firestoreService = AdminFirestoreService.getSharedInstance();
        AdminSentPromptService.sharedInstance = new AdminSentPromptService();
    }

    getCollectionRef() {
        return firestoreService.getCollectionRef(Collection.sentPrompts);
    }

    async getFirst(query: FirebaseFirestore.Query): Promise<SentPrompt | undefined> {
        return await firestoreService.getFirst(query, SentPrompt);
    }

    async save(model: SentPrompt): Promise<SentPrompt> {
        return firestoreService.save(model);
    }

    async getById(id: string): Promise<SentPrompt | undefined> {
        return await firestoreService.getById(id, SentPrompt);
    }


    async getSentPromptForCactusMemberId(options: { cactusMemberId: string, promptId: string }): Promise<SentPrompt | undefined> {

        const query = this.getCollectionRef().where(SentPrompt.Fields.promptId, "==", options.promptId)
            .where(SentPrompt.Fields.cactusMemberId, "==", options.cactusMemberId);

        return await this.getFirst(query);
    }

    async getAllForCactusMemberId(cactusMemberId: string): Promise<SentPrompt[]> {

        const query = this.getCollectionRef().where(SentPrompt.Fields.cactusMemberId, "==", cactusMemberId);

        const results = await firestoreService.executeQuery(query, SentPrompt);
        return results.results;
    }

    // async getByCampaignId
    async processMailchimpRecipient(recipient: SentToRecipient, prompt: ReflectionPrompt): Promise<SentPrompt | undefined> {
        console.log("processing recipient", recipient.email_address);
        let member = await this.cactusMemberService.getMemberByEmail(recipient.email_address);

        if (!prompt || !prompt.id) {
            console.log("no prompt id was provided to processMailchimpRecipient");
            return;
        }

        if (!member) {
            console.warn(`Unable to find an existing cactus member for the provided email ${recipient.email_address}... creating them now`);
            const profileMember = await this.mailchimpService.getMemberByEmail(recipient.email_address);
            if (!profileMember) {
                console.error("Couldn't get a profile member from mailchimp for email", recipient.email_address);
                return;
            } else {
                member = await this.cactusMemberService.updateFromMailchimpListMember(profileMember);
                console.log("got cactus member after calling updateFromMailchimpListMember", member);
            }

        } else {
            console.log("found cactus member for email", recipient.email_address, "cactus_member_id", member.id);
        }

        if (!member || !member.id) {
            console.warn("Still unable to get cactus member. Can't process email recipient for " + recipient.email_address);
            return;
        }


        let sentPrompt = await this.getSentPromptForCactusMemberId({cactusMemberId: member.id, promptId: prompt.id});
        const campaign = prompt.campaign;
        const reminderCampaign = prompt.reminderCampaign;

        if (sentPrompt) {
            console.log("Found existing SentPrompt", sentPrompt, "for user email", recipient.email_address);
            // we don't want to push more events to this user,
            // because of automation processing we can have lots of duplicates.
            // If we can find a solution to figuring out if a sent was already logged, handling for the automation case,
            // we can push history to these objects
            // API Docs: https://developer.mailchimp.com/documentation/mailchimp/reference/reports/sent-to/#read-get_reports_campaign_id_sent_to
        } else {
            sentPrompt = new SentPrompt();
            sentPrompt.id = `${member.id}_${prompt.id}`; //should be deterministic in the case we have a race condition
            sentPrompt.sendHistory.push({
                sendDate: new Date(),
                email: recipient.email_address,
                medium: PromptSendMedium.EMAIL_MAILCHIMP,
                mailchimpCampaignId: recipient.campaign_id,
                mailchimpEmailStatus: recipient.status
            });
        }
        sentPrompt.promptId = prompt.id;
        sentPrompt.firstSentAt = campaign ? getDateFromISOString(campaign.send_time) : prompt.sendDate;
        sentPrompt.cactusMemberId = member.id;
        sentPrompt.userId = member.userId;
        sentPrompt.lastSentAt = reminderCampaign ? getDateFromISOString(reminderCampaign.send_time) : prompt.sendDate;
        sentPrompt.memberEmail = member.email;

        return await this.save(sentPrompt);
    }


    async processSentMailchimpCampaign(options: { campaignId: string, promptId?: string }): Promise<CampaignSentPromptProcessingResult[]> {
        let promptId = options.promptId;
        const campaignId = options.campaignId;
        let prompt: ReflectionPrompt | undefined;
        //try to get the prompt id by campaign;
        if (!promptId) {
            prompt = await this.reflectionPromptService.getPromptForCampaignId(options.campaignId);
            promptId = prompt ? prompt.id : undefined;
        }

        //no prompt id provided, and not found by campaign. Can't continue
        if (!promptId) {
            console.warn(`No prompt ID found for the given campaign (${campaignId}). Can not process campaign to update SentPrompt record.`);
            return [{
                warning: {
                    campaignId,
                    message: `No prompt ID found for the given campaign (${campaignId}). Can not process campaign to update SentPrompt record.`
                }
            }];
        }

        //we have a prompt id but no prompt. Go get it.
        if (!prompt && promptId) {
            prompt = await AdminReflectionPromptService.getSharedInstance().get(promptId);

        }
        if (!prompt) {
            console.warn(`No prompt object found for the given promptId (${promptId}). Can not process campaign to update SentPrompt record.`);
            return [{
                warning: {
                    campaignId,
                    promptId,
                    message: `No prompt ID found for the given campaign (${campaignId}). Can not process campaign to update SentPrompt record.`
                }
            }];
        }
        const recipients = await this.mailchimpService.getAllSentTo(campaignId);
        const tasks: Promise<CampaignSentPromptProcessingResult>[] = recipients.map(recipient => {
            return new Promise<CampaignSentPromptProcessingResult>(async resolve => {
                try {
                    const sentPrompt = await this.processMailchimpRecipient(recipient, prompt as ReflectionPrompt);
                    resolve({sentPrompt, recipient});
                } catch (error) {
                    resolve({
                        recipient,
                        error: {
                            error,
                            campaignId,
                            message: `Unable to process mailchimp recipient for promptId=${promptId} email=${recipient.email_address}`
                        }
                    });
                }
            })
        });

        return await Promise.all(tasks);
    }
}