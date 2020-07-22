import AdminFirestoreService, { GetOptions, SaveOptions } from "@admin/services/AdminFirestoreService";
import User, { Field } from "@shared/models/User";
import * as admin from "firebase-admin";
import { BaseModel, Collection } from "@shared/FirestoreBaseModels";
import { CactusConfig } from "@admin/CactusConfig";
import CactusMember from "@shared/models/CactusMember";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import AdminReflectionResponseService from "@admin/services/AdminReflectionResponseService";
import AdminSentPromptService from "@admin/services/AdminSentPromptService";
import AdminSlackService, { AttachmentColor, ChannelName, SlackAttachment } from "@admin/services/AdminSlackService";
import AdminPendingUserService from "@admin/services/AdminPendingUserService";
import AdminEmailReplyService from "@admin/services/AdminEmailReplyService";
import AdminSocialInviteService from "@admin/services/AdminSocialInviteService";
import UserRecord = admin.auth.UserRecord;
import AdminMemberProfileService from "@admin/services/AdminMemberProfileService";
import AdminSocialConnectionService from "@admin/services/AdminSocialConnectionService";
import AdminSocialConnectionRequestService from "@admin/services/AdminSocialConnectionRequestService";
import MailchimpService from "@admin/services/MailchimpService";
import Logger from "@shared/Logger";
import AdminSubscriptionService from "@admin/services/AdminSubscriptionService";
import DeletedUser from "@shared/models/DeletedUser";
import { stringifyJSON } from "@shared/util/ObjectUtil";

const logger = new Logger("AdminUserService");

export interface SubscriberSignupResult {
    success: boolean,
    isNewUser?: boolean,
    error?: any,
    userRecord?: admin.auth.UserRecord,
    sentSignupLink: boolean
}

export interface SendMagicLinkResult {
    success: boolean,
    signinUrl?: string,
    email?: string,
    error?: any,
}

export interface SendMagicLinkOptions {
    successPath?: string,
}

export interface DeleteTaskResult {
    numDocuments: number,
    errors?: string[],
    collectionName: Collection
}

export interface DeleteUserResult {
    success: boolean,
    email: string,
    mailchimpDeleted?: boolean,
    userRecord?: UserRecord,
    userRecordDeleted?: boolean,
    users?: User[],
    members?: CactusMember[],
    errors?: string[],
    documentsDeleted: {
        [collection: string]: number,
    }
}

const DefaultSendMagicLinkOptions = {
    successPath: '/success',
};

export default class AdminUserService {
    config: CactusConfig;
    firestoreService: AdminFirestoreService;
    protected static sharedInstance: AdminUserService;

    constructor(config: CactusConfig) {
        this.config = config;
        this.firestoreService = AdminFirestoreService.getSharedInstance();
    }

    static getSharedInstance(): AdminUserService {
        if (!AdminUserService.sharedInstance) {
            throw new Error("No shared instance available. Ensure you initialize AdminUserService before using it");
        }
        return AdminUserService.sharedInstance;
    }

    static initialize(config: CactusConfig) {
        AdminUserService.sharedInstance = new AdminUserService(config);
    }

    getCollectionRef() {
        return AdminFirestoreService.getSharedInstance().getCollectionRef(Collection.users);
    }

    async save(model: User, options?: SaveOptions): Promise<User> {
        return this.firestoreService.save(model, options);
    }

    async getAuthUserByEmail(email: string): Promise<UserRecord | null> {
        try {
            const record = await admin.auth().getUserByEmail(email);
            logger.info(`Found user record ${ record.uid } for email ${ email }`);
            return record;
        } catch (error) {
            return null;
        }
    }

    async getMagicLinkUrl(email: string, options: SendMagicLinkOptions = DefaultSendMagicLinkOptions): Promise<SendMagicLinkResult> {
        let successPath = options.successPath || DefaultSendMagicLinkOptions.successPath;
        if (successPath && successPath.length > 0 && !successPath.startsWith("/")) {
            successPath = `/${ successPath }`
        }

        try {
            const signinUrl = await admin.auth().generateSignInWithEmailLink(email, {
                url: `${ this.config.web.domain }${ successPath }`,
                handleCodeInApp: true,
                dynamicLinkDomain: this.config.dynamic_links.domain,
            });
            return { success: true, signinUrl: signinUrl, email };
        } catch (e) {
            logger.error("Failed to generate signin url", e);
            return { success: false, error: e, email };
        }
    }

    async getByEmail(email: string): Promise<User | undefined> {
        let searchEmail = email;
        if (email && email.trim()) {
            searchEmail = email.trim().toLowerCase();
        }


        const query = this.firestoreService.getCollectionRef(Collection.users).where(Field.email, "==", searchEmail).limit(1);
        const result = await this.firestoreService.executeQuery(query, User);

        const [foundUser] = result.results;

        return foundUser;
    }

    async getAllMatchingEmail(email: string, options?: GetOptions): Promise<User[]> {
        let searchEmail = email;
        if (email && email.trim()) {
            searchEmail = email.trim().toLowerCase();
        }

        const query = this.firestoreService.getCollectionRef(Collection.users).where(Field.email, "==", searchEmail);
        const result = await this.firestoreService.executeQuery(query, User, options);

        return result.results;
    }

    async getById(id?: string | undefined, options?: GetOptions): Promise<User | undefined> {
        if (!id) {
            return undefined;
        }
        return await this.firestoreService.getById(id, User, options);
    }

    /**
     * Logically delete the user and the corresponding member
     * @param {string} id
     * @return {Promise<User | undefined>}
     */
    async delete(id: string): Promise<User | undefined> {
        const deletedUser = await this.firestoreService.delete(id, User);

        return deletedUser;
    }

    async setReferredByEmail(args: { userId: string, referredByEmail?: string | undefined }) {
        //todo: Should this set the referred by on a document without knowing if it exists? what if it does exist?
        try {
            if (args.referredByEmail === undefined) {
                return;
            }

            const { userId, referredByEmail } = args;
            await this.getCollectionRef().doc(userId).set({ [User.Field.referredByEmail]: referredByEmail }, {
                merge: true,
                // mergeFields: [User.Field.referredByEmail]
            });
        } catch (e) {
            logger.error("Failed to update referred by email", e);
        }

    }

    async deleteAllDataPermanently(options: { email: string, userRecord?: UserRecord, dryRun?: boolean, adminApp?: admin.app.App }): Promise<DeleteUserResult> {
        const startTime = new Date().getTime();
        const { email, userRecord, adminApp = admin } = options;

        const errors: string[] = [];
        const results: DeleteUserResult = { email, documentsDeleted: {}, success: false };
        const [members, users, firebaseUser] = await Promise.all([

            await AdminCactusMemberService.getSharedInstance().findAllMatchingAny({
                email,
                userId: userRecord?.uid
            }, { includeDeleted: true }),
            await AdminUserService.getSharedInstance().getAllMatchingEmail(email, { includeDeleted: true }),
            await new Promise<admin.auth.UserRecord | undefined>(async resolve => {
                if (userRecord) {
                    resolve(userRecord);
                    return;
                }
                try {
                    const u = await (adminApp.auth().getUserByEmail(email));
                    logger.log("got user from admin", u?.toJSON());
                    resolve(u);
                    return;
                } catch (e) {
                    logger.error("Failed to get user from admin");
                    resolve(undefined);
                    return;
                }
            })
        ]);
        logger.log("Firebase user.uid", firebaseUser?.uid);
        results.members = members;
        results.userRecord = firebaseUser;
        results.users = users;
        const memberIds = members.map(m => m.id).filter(id => !!id) as string[];
        const userIds = users.map(u => u.id).filter(id => !!id) as string[];
        logger.log("Found member ids", memberIds.join(", "));
        logger.log("Found userIds", userIds.join(", "));


        const subscriptionUnsubscribeResults = await Promise.all(members.map(m => {
            return AdminSubscriptionService.getSharedInstance().unsubscribeMember(m);
        }));

        logger.info("Subscription unsubscribe results", stringifyJSON(subscriptionUnsubscribeResults, 2));

        const generator = (collection: Collection, job: Promise<number>): Promise<DeleteTaskResult> => {
            return new Promise<DeleteTaskResult>(async resolve => {
                try {
                    logger.log("starting generator for collection", collection);
                    const count = (await job);
                    resolve({
                        numDocuments: count,
                        collectionName: collection
                    })
                } catch (error) {
                    logger.error(`"error in generator for collection ${ collection }`, error);
                    resolve({ numDocuments: 0, collectionName: collection, errors: [`${ error }`] })
                }
            })
        };

        const singleGenerator = (collection: Collection, job: Promise<BaseModel | undefined>): Promise<DeleteTaskResult> => {
            return new Promise<DeleteTaskResult>(async resolve => {
                try {
                    logger.log("Starting job for collection", collection);
                    const model = (await job);
                    resolve({
                        numDocuments: model ? 1 : 0,
                        collectionName: collection
                    })
                } catch (error) {
                    logger.error(`Failed to delete ${ collection }`, error);
                    resolve({ numDocuments: 0, collectionName: collection, errors: [`${ error }`] });
                }
            })
        };

        try {
            const tasks: Promise<DeleteTaskResult>[] = [
                ...(members.map(member => generator(Collection.reflectionResponses, AdminReflectionResponseService.getSharedInstance().deletePermanentlyForMember(member)))),
                ...(members.map(member => generator(Collection.sentPrompts, AdminSentPromptService.getSharedInstance().deletePermanentlyForMember(member || { email })))),
                ...(members.map(member => singleGenerator(Collection.members, AdminFirestoreService.getSharedInstance().deletePermanently(member)))),
                ...(memberIds.map(memberId => generator(Collection.memberProfiles, AdminMemberProfileService.getSharedInstance().deletePermanently(memberId)))),
                ...(memberIds.map(memberId => generator(Collection.socialConnections, AdminSocialConnectionService.getSharedInstance().deleteConnectionsPermanentlyForMember(memberId)))),
                ...(memberIds.map(memberId => generator(Collection.socialConnectionRequests, AdminSocialConnectionRequestService.getSharedInstance().deleteConnectionRequestsPermanentlyForMember(memberId)))),
                ...(users.map(user => singleGenerator(Collection.users, AdminFirestoreService.getSharedInstance().deletePermanently(user)))),
                generator(Collection.pendingUsers, AdminPendingUserService.getSharedInstance().deletePermanentlyForEmail(email)),
                generator(Collection.emailReply, AdminEmailReplyService.getSharedInstance().deletePermanentlyByEmail(email)),
                generator(Collection.socialInvites, AdminSocialInviteService.getSharedInstance().deleteSocialInvitesPermanently({
                    memberIds: memberIds,
                    email
                }))
            ];

            const taskResults = await Promise.all(tasks);

            logger.log("AdminUserService.deleteAllData: task results", taskResults);

            taskResults.reduce((agg, r) => {
                agg.errors?.concat(r.errors || []);
                agg.documentsDeleted[r.collectionName] = r.numDocuments;
                return agg;
            }, results);

            results.success = true;
        } catch (error) {
            logger.error("An unexpected error was thrown while deleting member data", error);
        }

        try {
            const adminRecord = results.userRecord || await adminApp.auth().getUserByEmail(email);
            if (adminRecord) {
                results.userRecord = adminRecord;
                await adminApp.auth().deleteUser(adminRecord.uid);
                results.userRecordDeleted = true;
            } else {
                results.userRecordDeleted = false;
            }
        } catch (error) {

            if (error.code !== "auth/user-not-found") {
                logger.error("Can't delete user record from auth", error);
                errors.push(`${ error.code } Failed to delete user record ${ error }`.trim());
            }
            results.userRecordDeleted = false;
        }

        try {
            const mailchimpResponse = await MailchimpService.getSharedInstance().deleteMemberPermanently(email);
            logger.log("mailchimp response", mailchimpResponse);
            if (mailchimpResponse.error) {
                errors.push(mailchimpResponse.error);
                results.mailchimpDeleted = false;
            } else {
                results.mailchimpDeleted = true;
            }
        } catch (error) {
            results.mailchimpDeleted = false;
        }

        results.errors = errors;
        const createdAt = members.find(m => m.createdAt)?.createdAt;

        const deletedUserRecordTasks = members.map(m => new Promise(async (resolve) => {
            const deletedUser = DeletedUser.create({
                member: m,
                documentsDeleted: results.documentsDeleted,
                errors: results.errors
            });
            await this.firestoreService.save(deletedUser);
            resolve(deletedUser);
        }))

        const deletedUsers = await Promise.all(deletedUserRecordTasks);
        logger.info("Created deleted user records", stringifyJSON(deletedUsers, 2));

        const userIdSet = new Set(users.map(u => u.id).concat(results.userRecord?.uid).filter(Boolean));
        const attachments: SlackAttachment[] = [
            {
                title: `:ghost: Deleted all data for ${ email }`,
                text: `\`\`\`` +
                `UserID(s): ${ Array.from(userIdSet).join(", ") || "none" }\n` +
                `MemberID(s): ${ memberIds.join(", ") || "none" }\n` +
                `Email: ${ email }\n` +
                `Joined At: ${ createdAt ? createdAt.toLocaleString('en-US', {
                    timeZone: 'America/Denver',
                    timeZoneName: 'short'
                }) : "unknown" }` +
                "\`\`\`"
            },
            {
                text: `Deleted Items\n\`\`\`` +
                `Auth User Deleted: ${ results.userRecord ? results.userRecordDeleted ?? false : "No User Record Found" }\n` +
                `Mailchimp Member Deleted: ${ results.mailchimpDeleted || "false" }\n` +
                `${ Collection.members }: ${ results.documentsDeleted[Collection.members] || 0 }\n` +
                `${ Collection.users }: ${ results.documentsDeleted[Collection.users] || 0 }\n` +
                `${ Collection.sentPrompts }: ${ results.documentsDeleted[Collection.sentPrompts] || 0 }\n` +
                `${ Collection.reflectionResponses }: ${ results.documentsDeleted[Collection.reflectionResponses] || 0 }\n` +
                `${ Collection.emailReply }: ${ results.documentsDeleted[Collection.emailReply] || 0 }\n` +
                `${ Collection.pendingUsers }: ${ results.documentsDeleted[Collection.pendingUsers] || 0 }\n` +
                `${ Collection.socialInvites }: ${ results.documentsDeleted[Collection.socialInvites] || 0 }\n` +
                `${ Collection.socialConnections }: ${ results.documentsDeleted[Collection.socialConnections] || 0 }\n` +
                `${ Collection.socialConnectionRequests }: ${ results.documentsDeleted[Collection.socialConnectionRequests] || 0 }\n` +
                `\`\`\``
            }
        ];

        if (errors && errors.length > 0) {
            attachments.push({
                title: "Errors",
                color: AttachmentColor.error,
                text: "```" + errors.map(e => JSON.stringify(e, null, 2)).join("\n") + "```",
            })
        }

        await AdminSlackService.getSharedInstance().sendDeletionMessage({
            text: "",
            attachments,
        });

        await AdminSlackService.getSharedInstance().uploadTextSnippet({
            message: `Subscription Cancellations for deleted user ${ email }`,
            data: stringifyJSON(subscriptionUnsubscribeResults, 2),
            fileType: "json",
            filename: `${ email }-unsubscribe-results.json`,
            channel: ChannelName.deletions,
        });

        const endTime = new Date().getTime();
        logger.log(`Delete user task took ${ endTime - startTime }ms`);
        return results;
    }
}