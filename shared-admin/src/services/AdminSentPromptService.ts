import AdminFirestoreService, {DeleteOptions, Timestamp} from "@admin/services/AdminFirestoreService";
import SentPrompt, {PromptSendMedium, SentPromptField} from "@shared/models/SentPrompt";
import {SentToRecipient} from "@shared/mailchimp/models/MailchimpTypes";
import MailchimpService from "@admin/services/MailchimpService";
import AdminReflectionPromptService from "@admin/services/AdminReflectionPromptService";
import {BaseModelField, Collection} from "@shared/FirestoreBaseModels";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import {getDateFromISOString} from "@shared/util/DateUtil";
import PendingUser from "@shared/models/PendingUser";
import CactusMember from "@shared/models/CactusMember";
import User from "@shared/models/User";
import AdminReflectionResponseService from "@admin/services/AdminReflectionResponseService";
import {QuerySortDirection} from "@shared/types/FirestoreConstants";
import * as Sentry from '@sentry/node';
import {isNonPromptCampaignId} from "@admin/config/configService";
import PromptContent from "@shared/models/PromptContent";
import {toTimestamp} from "@shared/util/FirestoreUtil";

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

export interface CreateSentPromptResult {
    sentPrompt?: SentPrompt | undefined,
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
        const query = this.getCollectionRef().where(SentPrompt.Fields.cactusMemberId, "==", cactusMemberId).orderBy(SentPrompt.Fields.firstSentAt, QuerySortDirection.desc);
        const results = await firestoreService.executeQuery(query, SentPrompt);
        return results.results;
    }

    async getAllForCactusMemberIds(cactusMemberIds: string[]): Promise<SentPrompt[]> {
        const query = this.getCollectionRef().where(SentPrompt.Fields.cactusMemberId, "in", cactusMemberIds).orderBy(SentPrompt.Fields.firstSentAt, QuerySortDirection.desc);
        const results = await firestoreService.executeQuery(query, SentPrompt);
        return results.results;
    }

    /**
     *
     * @param {SentToRecipient} recipient
     * @param {ReflectionPrompt} prompt
     * @return {Promise<SentPrompt | undefined>}
     * @throws if something goes wrong
     */
    async processMailchimpRecipient(recipient: SentToRecipient, prompt: ReflectionPrompt): Promise<SentPrompt | undefined> {
        console.log("processing recipient", recipient.email_address);
        try {
            if (!prompt || !prompt.id) {
                console.log("no prompt id was provided to processMailchimpRecipient");
                return;
            }

            let member = await this.cactusMemberService.getMemberByEmail(recipient.email_address, {throwOnError: true});
            if (!member) {
                console.warn(`Unable to find an existing cactus member for the provided email ${recipient.email_address}... Attempting to upsert them from mailchimp data now.`);
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


            let sentPrompt = await this.getSentPromptForCactusMemberId({
                cactusMemberId: member.id,
                promptId: prompt.id
            });
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
        } catch (error) {
            console.error("Failed to process mailchimp recipient", error);
            Sentry.captureException(error);
            throw error;
        }
    }

    /**
     * Creates a sent prompt object. This *DOES NOT* save it.
     * @param {{member: CactusMember,
     *  promptId?: string, promptContent?: PromptContent,
     *  medium?: PromptSendMedium,
     *  prompt?: ReflectionPrompt}} options
     * @return {CreateSentPromptResult}
     */
    static createSentPrompt(options: {
        member: CactusMember,
        promptId?: string,
        promptContent?: PromptContent,
        medium?: PromptSendMedium,
        prompt?: ReflectionPrompt
        createHistoryItem?: boolean,
    }): CreateSentPromptResult {
        const result: CreateSentPromptResult = {};
        const {member, promptContent, prompt, medium = PromptSendMedium.CRON_JOB, createHistoryItem = false} = options;
        let {promptId} = options;
        promptId = promptId || promptContent?.promptId || prompt?.id;
        if (!promptId) {
            result.error = "No prompt ID provided";
            return result;
        }

        if (!member.id) {
            result.error = "No member ID could be found";
            return result;
        }

        const memberId = member.id;
        const email = member.email;
        const currentDate = new Date();

        const sentPrompt = new SentPrompt();
        sentPrompt.createdAt = currentDate;
        sentPrompt.id = `${memberId}_${promptId}`; //should be deterministic in the case we have a race condition
        sentPrompt.firstSentAt = currentDate;
        sentPrompt.promptId = promptId;
        sentPrompt.cactusMemberId = member.id;
        sentPrompt.userId = member.userId;
        sentPrompt.memberEmail = member.email;
        if (createHistoryItem) {
            sentPrompt.sendHistory.push({
                sendDate: currentDate,
                email,
                medium,
            });
        }

        result.sentPrompt = sentPrompt;
        return result;
    }

    //Mostly copied from the mailchimp recipient job above.
    async upsertForCactusMember(member: CactusMember, prompt: ReflectionPrompt, sendDate?: Date, dryRun: boolean = false): Promise<UpsertSentPromptResult> {
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

            if (!dryRun) {
                const saved = await this.save(sentPrompt);
                result.sentPrompt = saved;
            } else {
                result.sentPrompt = sentPrompt
            }

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


        if (isNonPromptCampaignId(campaignId)) {
            console.log(`Campaign ID ${campaignId} is a known non-prompt. not processing recipients.`);
            return [];
        }

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
        const allResults: CampaignSentPromptProcessingResult[] = [];
        await this.mailchimpService.getAllSentTo(campaignId, {
            onPage: async (recipients, pageNumber) => {
                console.log(`Processing mailchimp recipient page #${pageNumber}`);
                const tasks = this.createMailchimpRecipientPageTasks({
                    promptId: prompt!.id!,
                    prompt: prompt!,
                    campaignId,
                    recipients
                });

                const results = await Promise.all(tasks);
                allResults.push(...results);
            }
        });
        console.log("All Recipients finished. allRecipients size = ", allResults.length);
        console.log(`Finished getting all recipient for mailchimp_campaign_id ${campaignId}. PromptId = ${prompt.id}`);
        return allResults;
    }

    createMailchimpRecipientPageTasks(options: { promptId: string, campaignId: string, prompt: ReflectionPrompt, recipients: SentToRecipient[] }): Promise<CampaignSentPromptProcessingResult>[] {
        const {recipients, promptId, campaignId, prompt} = options;
        return recipients.map(recipient => new Promise<CampaignSentPromptProcessingResult>(async resolve => {
            try {
                const sentPrompt = await this.processMailchimpRecipient(recipient, prompt);
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
        }));
    }

    /**
     *
     * @param {{promptId: string; memberId: string; completed: boolean; completedAt?: Date}} opts
     * @return {Promise<number>} number of documents updated
     */
    async setCompletedStatus(opts: { promptId: string, memberId: string, completed: boolean, completedAt?: Date }): Promise<{ numSuccess: number, numError: number }> {
        const {promptId, memberId, completed, completedAt} = opts;
        const query = this.getCollectionRef()
            .where(SentPromptField.cactusMemberId, "==", memberId)
            .where(SentPromptField.promptId, "==", promptId);

        const snapshot = await query.get();
        const tasks = snapshot.docs.map(doc => {
            return new Promise<boolean>(async resolve => {
                const ref = doc.ref;
                try {
                    const data: { completed: boolean, completedAt?: Timestamp } = {completed};
                    if (completed && completedAt) {
                        data.completedAt = toTimestamp(completedAt);
                    } else if (completed && !completedAt) {
                        console.error("When marking a sent prompt as completed you must provide the completed date");
                        resolve(false);
                        return;
                    }
                    await ref.update(data);
                    return resolve(true);
                } catch (error) {
                    console.error(`Failed to update completed status for promptId ${promptId} | memberId ${memberId}`, error.code === "NOT_FOUND" ? "not found" : error);
                    resolve(false);
                }
                return;
            })

        });

        const taskResults = await Promise.all(tasks);
        const initial = {numSuccess: 0, numError: 0};
        return taskResults.reduce((total: { numSuccess: number, numError: number }, r) => {
            if (r) {
                total.numSuccess += 1;
            } else {
                total.numError += 1;
            }
            return total;
        }, initial)
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
                                sentPrompt.id = `${member.id}_${reflectionResponse.promptId}`; //should be deterministic in the case we have a race condition
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

    async deletePermanentlyForMember(member: CactusMember | { email?: string, id?: string }, options?: DeleteOptions): Promise<number> {
        let totalDeleted = 0;
        if (member.email) {
            const query = this.getCollectionRef().where(SentPrompt.Fields.memberEmail, "==", member.email);
            totalDeleted += await AdminFirestoreService.getSharedInstance().deletePermanentlyForQuery(query, options)
        }

        if (member.id) {
            const query = this.getCollectionRef().where(SentPrompt.Fields.cactusMemberId, "==", member.id);
            totalDeleted += await AdminFirestoreService.getSharedInstance().deletePermanentlyForQuery(query, options)
        }

        console.log(`Permanently deleted ${totalDeleted} sent prompts for member ${member.email || member.id}`);
        return totalDeleted
    }

    async getAllBatch(options: {
        batchSize?: number,
        beforeDate: Date,
        excludeCompleted?: boolean
        onData: (sentPrompts: SentPrompt[], batchNumber: number) => Promise<void>
    }) {
        console.log("Getting batched result 1 for all members");
        let query: FirebaseFirestore.Query = this.getCollectionRef();

        if (options.excludeCompleted === true) {
            query = query.where(SentPromptField.completed, "==", false);
        }

        if (options.beforeDate) {
            query = query.where(BaseModelField.createdAt, "<", toTimestamp(options.beforeDate))
        }

        await AdminFirestoreService.getSharedInstance().executeBatchedQuery({
            query,
            type: SentPrompt,
            onData: options.onData,
            batchSize: options.batchSize,
            sortDirection: QuerySortDirection.asc,
            orderBy: BaseModelField.createdAt
        })
    }
}
