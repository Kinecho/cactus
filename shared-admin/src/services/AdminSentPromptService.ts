import AdminFirestoreService, { DeleteOptions } from "@admin/services/AdminFirestoreService";
import SentPrompt, { PromptSendMedium, SentPromptField } from "@shared/models/SentPrompt";
import { BaseModelField, Collection } from "@shared/FirestoreBaseModels";
import ReflectionPrompt, { PromptType } from "@shared/models/ReflectionPrompt";
import PendingUser from "@shared/models/PendingUser";
import CactusMember from "@shared/models/CactusMember";
import User from "@shared/models/User";
import AdminReflectionResponseService from "@admin/services/AdminReflectionResponseService";
import { QuerySortDirection } from "@shared/types/FirestoreConstants";
import PromptContent from "@shared/models/PromptContent";
import { TimestampInterface, toTimestamp } from "@shared/util/FirestoreUtil";
import Logger from "@shared/Logger";
import ReflectionResponse from "@shared/models/ReflectionResponse";

const logger = new Logger("AdminSentPromptService");

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


    async getSentPromptForCactusMemberId(options: { cactusMemberId?: string, promptId?: string }): Promise<SentPrompt | undefined> {
        const { cactusMemberId, promptId } = options;
        if (!cactusMemberId || !promptId) {
            return undefined;
        }

        const query = this.getCollectionRef().where(SentPrompt.Fields.promptId, "==", promptId)
        .where(SentPrompt.Fields.cactusMemberId, "==", cactusMemberId);

        return await this.getFirst(query);
    }

    /**
     * For a given Reflection Response, find the related Sent Prompt.
     * @param {ReflectionResponse} reflectionResponse
     * @return {Promise<SentPrompt | null>}
     */
    async getSentPromptForReflectionResponse(reflectionResponse: ReflectionResponse): Promise<SentPrompt | null> {
        const memberId = reflectionResponse.cactusMemberId;
        const promptId = reflectionResponse.promptId;

        if (!memberId || !promptId) {
            return null;
        }

        const sentPrompt = await this.getSentPromptForCactusMemberId({ cactusMemberId: memberId, promptId })
        return sentPrompt ?? null;
    }

    async upsertSentPromptOnReflection(reflectionResponse: ReflectionResponse, member: CactusMember): Promise<{ created: boolean, sentPrompt: SentPrompt | null }> {
        let created = false;
        let sentPrompt = await this.getSentPromptForReflectionResponse(reflectionResponse)

        const memberId = member.id;
        const promptId = reflectionResponse.promptId;
        if (!memberId || !promptId) {
            return { created: false, sentPrompt: null }
        }

        if (!sentPrompt) {
            sentPrompt = AdminSentPromptService.create({
                memberId,
                promptId,
                userId: member.userId,
                memberEmail: member.email,
                createHistoryItem: true,
                medium: PromptSendMedium.PROMPT_CONTENT,
                promptType: reflectionResponse.promptType,
            })
            created = true;
        } else if (sentPrompt.completed) {
            return { created: false, sentPrompt };
        }

        sentPrompt.completed = true;
        sentPrompt.completedAt = sentPrompt.completedAt ?? new Date();

        const saved = await this.save(sentPrompt)

        return { created, sentPrompt: saved }
    }

    async getAllForCactusMemberId(cactusMemberId: string): Promise<SentPrompt[]> {
        const query = this.getCollectionRef().where(SentPrompt.Fields.cactusMemberId, "==", cactusMemberId).orderBy(SentPrompt.Fields.firstSentAt, QuerySortDirection.desc);
        const results = await firestoreService.executeQuery(query, SentPrompt);
        return results.results;
    }

    static getSentPromptId(params: { memberId: string, promptId: string }): string {
        const { memberId, promptId } = params;
        return `${ memberId }_${ promptId }`; //should be deterministic in the case we have a race condition
    }

    static create(params: {
        memberId: string,
        promptId: string,
        memberEmail?: string,
        medium?: PromptSendMedium,
        prompt?: ReflectionPrompt,
        promptType?: PromptType | null,
        userId?: string,
        createHistoryItem?: boolean,
    }): SentPrompt {

        const currentDate = new Date();
        const sentPrompt = new SentPrompt();
        const { memberId, promptId, createHistoryItem } = params;

        sentPrompt.id = AdminSentPromptService.getSentPromptId({ memberId, promptId });
        sentPrompt.promptType = params.promptType ?? PromptType.CACTUS
        sentPrompt.createdAt = currentDate;
        sentPrompt.firstSentAt = currentDate;
        sentPrompt.lastSentAt = currentDate;
        sentPrompt.promptId = params.promptId;
        sentPrompt.cactusMemberId = params.memberId;
        // sentPrompt.userId = member.userId;
        sentPrompt.memberEmail = params.memberEmail;
        if (createHistoryItem) {
            sentPrompt.sendHistory.push({
                sendDate: currentDate,
                email: params.memberEmail,
                medium: params.medium ?? PromptSendMedium.PROMPT_CONTENT,
            });
        }

        return sentPrompt;
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
        prompt?: ReflectionPrompt,
        userId?: string,
        promptType?: PromptType,
        createHistoryItem?: boolean,
    }): CreateSentPromptResult {
        const result: CreateSentPromptResult = {};
        const {
            member,
            promptContent,
            prompt,
            medium = PromptSendMedium.CRON_JOB,
            createHistoryItem = false,
            promptType
        } = options;
        let { promptId } = options;
        promptId = promptId || promptContent?.promptId || prompt?.id;
        if (!promptId) {
            result.error = "No prompt ID provided";
            return result;
        }

        const memberId = member.id;
        if (!memberId) {
            result.error = "No member ID could be found";
            return result;
        }

        result.sentPrompt = AdminSentPromptService.create({
            memberId,
            promptId,
            promptType: promptType ?? prompt?.promptType ?? promptContent ? PromptType.CACTUS : undefined,
            userId: member.userId,
            memberEmail: member.email,
            createHistoryItem,
            medium,
        });
        return result;
    }

    //Mostly copied from the mailchimp recipient job above.
    async upsertForCactusMember(member: CactusMember, prompt: ReflectionPrompt, sendDate?: Date, dryRun: boolean = false): Promise<UpsertSentPromptResult> {
        try {
            logger.log("processing cactus member", member.email);
            // let member = await this.cactusMemberService.getMemberByEmail(recipient.email_address);
            if (!member.id) {
                logger.error("No ID found on the cactus member object.");
                return { error: "No ID found on the cactus member object" };
            }
            const email = member.email;
            if (!prompt || !prompt.id) {
                logger.error("no prompt id was provided to processMailchimpRecipient");
                return { error: "no prompt id was provided to processMailchimpRecipient" };
            }
            const result: UpsertSentPromptResult = {};
            let sentPrompt = await this.getSentPromptForCactusMemberId({
                cactusMemberId: member.id,
                promptId: prompt.id
            });

            if (sentPrompt) {
                result.existed = true;
                logger.log("Found existing SentPrompt", sentPrompt, "for user email", email);
                // we don't want to push more events to this user,
                // because of automation processing we can have lots of duplicates.
                // If we can find a solution to figuring out if a sent was already logged, handling for the automation case,
                // we can push history to these objects
                // API Docs: https://developer.mailchimp.com/documentation/mailchimp/reference/reports/sent-to/#read-get_reports_campaign_id_sent_to
            } else {
                result.existed = false;
                sentPrompt = new SentPrompt();
                sentPrompt.createdAt = new Date();
                sentPrompt.id = `${ member.id }_${ prompt.id }`; //should be deterministic in the case we have a race condition
                sentPrompt.firstSentAt = sendDate || prompt.sendDate || new Date();
                sentPrompt.lastSentAt = sendDate || prompt.sendDate || new Date();
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
            logger.error("Failed to run upsertSentPromptForMember", error);
            return { error };
        }
    }

    /**
     *
     * @param {{promptId: string; memberId: string; completed: boolean; completedAt?: Date}} opts
     * @return {Promise<number>} number of documents updated
     */
    async setCompletedStatus(opts: { promptId: string, memberId: string, completed: boolean, completedAt?: Date }): Promise<{ numSuccess: number, numError: number }> {
        const { promptId, memberId, completed, completedAt } = opts;
        const query = this.getCollectionRef()
        .where(SentPromptField.cactusMemberId, "==", memberId)
        .where(SentPromptField.promptId, "==", promptId);

        const snapshot = await query.get();
        const tasks = snapshot.docs.map(doc => {
            return new Promise<boolean>(async resolve => {
                const ref = doc.ref;
                try {
                    const data: { completed: boolean, completedAt?: TimestampInterface } = { completed };
                    if (completed && completedAt) {
                        data.completedAt = toTimestamp(completedAt);
                    } else if (completed && !completedAt) {
                        logger.error("When marking a sent prompt as completed you must provide the completed date");
                        resolve(false);
                        return;
                    }
                    await ref.update(data);
                    resolve(true);
                    return;
                } catch (error) {
                    logger.error(`Failed to update completed status for promptId ${ promptId } | memberId ${ memberId }`, error.code === "NOT_FOUND" ? "not found" : error);
                    resolve(false);
                }
                return;
            })

        });

        const taskResults = await Promise.all(tasks);
        const initial = { numSuccess: 0, numError: 0 };
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
        const { reflectionResponseIds, member, userId } = options;

        const idSet = new Set(reflectionResponseIds);

        idSet.forEach(id => {
            tasks.push(new Promise(async resolve => {
                try {
                    const reflectionResponse = await AdminReflectionResponseService.getSharedInstance().getById(id);
                    if (reflectionResponse) {
                        logger.log(`Updating anonymous reflection response to have member info PromptId = ${ id } | MemberEmail = ${ member.email } | MemberId = ${ member.id }`);
                        reflectionResponse.anonymous = false;
                        reflectionResponse.cactusMemberId = member.id;
                        reflectionResponse.memberEmail = member.email;
                        reflectionResponse.mailchimpMemberId = member.mailchimpListMember && member.mailchimpListMember.id;
                        reflectionResponse.mailchimpUniqueEmailId = member.mailchimpListMember && member.mailchimpListMember.unique_email_id;
                        reflectionResponse.userId = userId || member.userId;
                        await AdminReflectionResponseService.getSharedInstance().save(reflectionResponse);


                        logger.log(`Setting up the sent prompt for the ${ member.email }`);
                        if (member.id && reflectionResponse.promptId) {
                            // let sentPrompt: SentPrompt | undefined;
                            logger.log(`attempting to fetch sent prompt for ${ reflectionResponse.promptId }`);
                            let sentPrompt = await this.getSentPromptForCactusMemberId({
                                cactusMemberId: member.id,
                                promptId: reflectionResponse.promptId
                            });


                            if (!sentPrompt) {
                                sentPrompt = new SentPrompt();
                                sentPrompt.id = `${ member.id }_${ reflectionResponse.promptId }`; //should be deterministic in the case we have a race condition
                                sentPrompt.promptId = reflectionResponse.promptId;
                                sentPrompt.cactusMemberId = member.id;
                                sentPrompt.memberEmail = member.email;
                                sentPrompt.firstSentAt = reflectionResponse.createdAt || new Date();
                                sentPrompt.lastSentAt = reflectionResponse.createdAt || new Date();
                                sentPrompt.userId = userId || member.userId;
                                await AdminSentPromptService.getSharedInstance().save(sentPrompt);
                                logger.log("Saved sent prompt successfully");
                            } else {
                                logger.log("A sent prompt already existed for this member")
                            }
                        } else {
                            logger.warn(" no member ID or reflectionResponse.promptId, can not create sent prompt");
                        }
                    }
                    resolve();
                    return;
                } catch (error) {
                    logger.error("Failed to set up sentPrompt", error);
                    resolve();
                    return;
                }
            }));
        });

        await Promise.all(tasks);
    }

    async initializeSentPromptsFromPendingUser(options: { pendingUser?: PendingUser, member: CactusMember, user: User }): Promise<void> {
        const { member, user, pendingUser } = options;

        if (!pendingUser) {
            return;
        }

        logger.log(`setting up pending user for email ${ member.email }`);
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

        logger.log(`Permanently deleted ${ totalDeleted } sent prompts for member ${ member.email || member.id }`);
        return totalDeleted
    }

    async getAllBatch(options: {
        batchSize?: number,
        beforeDate: Date,
        excludeCompleted?: boolean
        onData: (sentPrompts: SentPrompt[], batchNumber: number) => Promise<void>
    }) {
        logger.log("Getting batched result 1 for all members");
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
