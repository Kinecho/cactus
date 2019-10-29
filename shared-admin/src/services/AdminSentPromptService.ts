import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import SentPrompt, {PromptSendMedium} from "@shared/models/SentPrompt";
import {SentToRecipient} from "@shared/mailchimp/models/MailchimpTypes";
import MailchimpService from "@admin/services/MailchimpService";
import AdminReflectionPromptService from "@admin/services/AdminReflectionPromptService";
import {Collection} from "@shared/FirestoreBaseModels";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import {getDateFromISOString} from "@shared/util/DateUtil";
import PendingUser from "@shared/models/PendingUser";
import CactusMember from "@shared/models/CactusMember";
import User from "@shared/models/User";
import AdminReflectionResponseService from "@admin/services/AdminReflectionResponseService";


export interface CampaignSentPromptProcessingResult {
    sentPrompt?: SentPrompt,
    recipient?: SentToRecipient,
    error?: { message?: string, error?: any, campaignId?: string }
    warning?: { message?: string, campaignId?: string, promptId?: string }
}


export interface UpsertSentPromptResult {
    sentPrompt?: SentPrompt | undefined,
    existed?: boolean,
    error?: any
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
            sentPrompt.createdAt = new Date();
            sentPrompt.id = `${member.id}_${prompt.id}`; //should be deterministic in the case we have a race condition
            sentPrompt.firstSentAt = campaign ? getDateFromISOString(campaign.send_time) : prompt.sendDate;
            sentPrompt.lastSentAt = reminderCampaign ? getDateFromISOString(reminderCampaign.send_time) : prompt.sendDate;
            sentPrompt.sendHistory.push({
                sendDate: new Date(),
                email: recipient.email_address,
                medium: PromptSendMedium.EMAIL_MAILCHIMP,
                mailchimpCampaignId: recipient.campaign_id,
                mailchimpEmailStatus: recipient.status
            });
        }

        //only update the sendDate if it's not an automation
        if (campaign && campaign.type !== 'automation') {
            sentPrompt.firstSentAt = campaign ? getDateFromISOString(campaign.send_time) : prompt.sendDate;
            sentPrompt.lastSentAt = reminderCampaign ? getDateFromISOString(reminderCampaign.send_time) : prompt.sendDate;
        }

        sentPrompt.promptId = prompt.id;
        sentPrompt.cactusMemberId = member.id;
        sentPrompt.userId = member.userId;
        sentPrompt.memberEmail = member.email;

        return await this.save(sentPrompt);
    }


    //Mostly copied from the mailchimp recipient job above.
    async upsertForCactusMember(member: CactusMember, prompt: ReflectionPrompt, sendDate?: Date): Promise<UpsertSentPromptResult> {
        try {


            console.log("processing cactus member", member.email);
            // let member = await this.cactusMemberService.getMemberByEmail(recipient.email_address);
            if (!member.id) {
                console.error("No ID found on the cactus member object.");
                return {error: "No ID found on the cactus member object"};
            }
            const email = member.email;
            if (!prompt || !prompt.id) {
                console.error("no prompt id was provided to processMailchimpRecipient");
                return {error: "no prompt id was provided to processMailchimpRecipient"};
            }
            const result: UpsertSentPromptResult = {};
            let sentPrompt = await this.getSentPromptForCactusMemberId({
                cactusMemberId: member.id,
                promptId: prompt.id
            });

            if (sentPrompt) {
                result.existed = true;
                console.log("Found existing SentPrompt", sentPrompt, "for user email", email);
                // we don't want to push more events to this user,
                // because of automation processing we can have lots of duplicates.
                // If we can find a solution to figuring out if a sent was already logged, handling for the automation case,
                // we can push history to these objects
                // API Docs: https://developer.mailchimp.com/documentation/mailchimp/reference/reports/sent-to/#read-get_reports_campaign_id_sent_to
            } else {
                result.existed = false;
                sentPrompt = new SentPrompt();
                sentPrompt.createdAt = new Date();
                sentPrompt.id = `${member.id}_${prompt.id}`; //should be deterministic in the case we have a race condition
                sentPrompt.firstSentAt = sendDate || prompt.sendDate || new Date();
                sentPrompt.sendHistory.push({
                    sendDate: sentPrompt.firstSentAt,
                    email,
                    medium: PromptSendMedium.CRON_JOB,
                });
            }

            //only update the sendDate if it's not an automation
            //TODO: not sure if we need a way to update the send date on this. We can easly add this if needed
            // if (campaign && campaign.type !== 'automation') {
            //     sentPrompt.firstSentAt = sendDate || prompt.sendDate || new Date();
            // }

            sentPrompt.promptId = prompt.id;
            sentPrompt.cactusMemberId = member.id;
            sentPrompt.userId = member.userId;
            sentPrompt.memberEmail = member.email;

            const saved = await this.save(sentPrompt);
            result.sentPrompt = saved;
            return result;
        } catch (error) {
            console.error("Failed to run upsertSentPromptForMember", error);
            return {error};
        }

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

    async createSentPromptsFromReflectionResponseIds(options: { reflectionResponseIds: string[], member: CactusMember, userId?: string }): Promise<void> {
        const tasks: Promise<any>[] = [];
        const {reflectionResponseIds, member, userId} = options;

        const idSet = new Set(reflectionResponseIds);

        idSet.forEach(id => {
            tasks.push(new Promise(async resolve => {
                try {
                    const reflectionResponse = await AdminReflectionResponseService.getSharedInstance().getById(id);
                    if (reflectionResponse) {
                        console.log(`Updating anonymous reflection response to have member info PromptId = ${id} | MemberEmail = ${member.email} | MemberId = ${member.id}`);
                        reflectionResponse.anonymous = false;
                        reflectionResponse.cactusMemberId = member.id;
                        reflectionResponse.memberEmail = member.email;
                        reflectionResponse.mailchimpMemberId = member.mailchimpListMember && member.mailchimpListMember.id;
                        reflectionResponse.mailchimpUniqueEmailId = member.mailchimpListMember && member.mailchimpListMember.unique_email_id;
                        reflectionResponse.userId = userId || member.userId;
                        await AdminReflectionResponseService.getSharedInstance().save(reflectionResponse);


                        console.log(`Setting up the sent prompt for the ${member.email}`);
                        if (member.id && reflectionResponse.promptId) {
                            // let sentPrompt: SentPrompt | undefined;
                            console.log(`attempting to fetch sent prompt for ${reflectionResponse.promptId}`);
                            let sentPrompt = await this.getSentPromptForCactusMemberId({
                                cactusMemberId: member.id,
                                promptId: reflectionResponse.promptId
                            });


                            if (!sentPrompt) {
                                sentPrompt = new SentPrompt();
                                sentPrompt.promptId = reflectionResponse.promptId;
                                sentPrompt.cactusMemberId = member.id;
                                sentPrompt.memberEmail = member.email;
                                sentPrompt.firstSentAt = reflectionResponse.createdAt || new Date();
                                sentPrompt.lastSentAt = reflectionResponse.createdAt || new Date();
                                sentPrompt.userId = userId || member.userId;
                                await AdminSentPromptService.getSharedInstance().save(sentPrompt);
                                console.log("Saved sent prompt successfully");
                            } else {
                                console.log("A sent prompt already existed for this member")
                            }
                        } else {
                            console.warn(" no member ID or reflectionResponse.promptId, can not create sent prompt");
                        }
                    }
                    resolve();
                    return;
                } catch (error) {
                    console.error("Failed to set up sentPrompt", error);
                    resolve();
                    return;
                }
            }));
        });

        await Promise.all(tasks);
    }

    async initializeSentPromptsFromPendingUser(options: { pendingUser?: PendingUser, member: CactusMember, user: User }): Promise<void> {
        const {member, user, pendingUser} = options;

        if (!pendingUser) {
            return;
        }

        console.log(`setting up pending user for email ${member.email}`);
        const tasks: Promise<any>[] = [];
        if (pendingUser.reflectionResponseIds) {
            await this.createSentPromptsFromReflectionResponseIds({
                reflectionResponseIds: pendingUser.reflectionResponseIds,
                member,
                userId: user.id,
            })

        }

        await Promise.all(tasks);


        return;
    }

    async deletePermanentlyForMember(member: CactusMember | { email?: string, id?: string }): Promise<number> {
        const tasks: Promise<number>[] = [];
        if (member.email) {
            const query = this.getCollectionRef().where(SentPrompt.Fields.memberEmail, "==", member.email);
            tasks.push(AdminFirestoreService.getSharedInstance().deletePermanentlyForQuery(query))
        }

        if (member.id) {
            const query = this.getCollectionRef().where(SentPrompt.Fields.cactusMemberId, "==", member.id);
            tasks.push(AdminFirestoreService.getSharedInstance().deletePermanentlyForQuery(query))
        }

        const results: number[] = await Promise.all(tasks);
        const totalDeleted = results.reduce((total, num) => {
            return total + num
        }, 0);

        console.log(`Permanently deleted ${totalDeleted} sent prompts for member ${member.email || member.id}`)
        return totalDeleted
    }
}
