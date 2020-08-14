import AdminFirestoreService, { QueryOptions, SaveOptions, Transaction } from "@admin/services/AdminFirestoreService";
import PendingUser, { PendingUserStatus } from "@shared/models/PendingUser";
import { Collection } from "@shared/FirestoreBaseModels";
import { QuerySortDirection } from "@shared/types/FirestoreConstants";
import Logger from "@shared/Logger";

const logger = new Logger("AdminPendingUserService");
let firestoreService: AdminFirestoreService;

export interface PendingUserRequest {
    email: string,
    referredByEmail?: string,
    reflectionResponseIds?: string[],
    queryParams?: { [name: string]: string | null },
}

export default class AdminPendingUserService {
    protected static sharedInstance: AdminPendingUserService;

    static getSharedInstance(): AdminPendingUserService {
        if (!AdminPendingUserService.sharedInstance) {
            throw new Error("No shared instance available. Ensure you initialize AdminPendingUserService before using it");
        }
        return AdminPendingUserService.sharedInstance;
    }

    static initialize() {
        firestoreService = AdminFirestoreService.getSharedInstance();
        AdminPendingUserService.sharedInstance = new AdminPendingUserService();
    }

    getCollectionRef() {
        return AdminFirestoreService.getSharedInstance().getCollectionRef(Collection.pendingUsers);
    }

    async save(model: PendingUser, options?: SaveOptions): Promise<PendingUser> {
        return firestoreService.save(model, options);
    }

    async getById(id: string): Promise<PendingUser | undefined> {
        return await firestoreService.getById(id, PendingUser);
    }

    async getPendingByEmail(email: string, options?: QueryOptions): Promise<PendingUser | undefined> {
        try {
            const query = this.getCollectionRef()
            .where(PendingUser.Field.email, "==", email)
            .where(PendingUser.Field.status, "==", PendingUserStatus.PENDING)
            .orderBy(PendingUser.Field.magicLinkSentAt, QuerySortDirection.desc);

            return await AdminFirestoreService.getSharedInstance().getFirst(query, PendingUser, options);
        } catch (e) {
            logger.error("Failed to execute getPendingByEmail", e);
            return;
        }

    }

    /**
     * this will clear any pending user signups and create a new one
     * @param {object} args
     * @param {string} args.email - the email of the user that is signing up via magic link
     * @param {referredByEmail} [args.referredByEmail] - the optional email of the person that referred this user
     * @return {Promise<PendingUser>}
     */
    async addPendingSignup(args: PendingUserRequest): Promise<PendingUser> {
        const { email, referredByEmail, reflectionResponseIds = [], queryParams = {} } = args;
        let recentReferrer: PendingUser | undefined = undefined;
        if (!referredByEmail) {
            recentReferrer = await this.findMostRecentReferrer(email);
        }

        await this.cancelAllPending(email);


        if (recentReferrer && recentReferrer.reflectionResponseIds) {
            recentReferrer.reflectionResponseIds
            .filter(id => !reflectionResponseIds.includes(id))
            .forEach(id => reflectionResponseIds.push(id));
        }

        const pendingUser = new PendingUser();
        pendingUser.email = email;
        pendingUser.referredByEmail = referredByEmail;
        pendingUser.reflectionResponseIds = reflectionResponseIds;
        pendingUser.queryParams = queryParams;

        if (!referredByEmail && recentReferrer && recentReferrer.referredByEmail) {
            pendingUser.referredByEmail = recentReferrer.referredByEmail;
            pendingUser.previousReferrerPendingUserId = recentReferrer.id;
            pendingUser.usedPreviousReferrer = true;
        }

        if (recentReferrer && recentReferrer.queryParams) {
            pendingUser.queryParams = { ...recentReferrer.queryParams, ...queryParams };
            logger.log("merged query params into ", pendingUser.queryParams)
        }

        pendingUser.status = PendingUserStatus.PENDING;
        pendingUser.magicLinkSentAt = new Date();
        const savedPending = await this.save(pendingUser);
        logger.log("Saved pending user", savedPending);
        return savedPending;

    }

    async cancelAllPending(email: string): Promise<PendingUser[]> {
        logger.log("attempting to cancel all pending users");
        try {
            const query = this.getCollectionRef()
            .where(PendingUser.Field.email, "==", email)
            .where(PendingUser.Field.status, "==", PendingUserStatus.PENDING);

            const now = new Date();
            const results = await AdminFirestoreService.getSharedInstance().executeQuery(query, PendingUser);
            logger.log("got pending results", results.size);
            const tasks = results.results.map(pending => {
                pending.signupCanceledAt = now;
                pending.status = PendingUserStatus.CANCELED;
                return this.save(pending)
            });
            logger.log("awaiting all update tasks");
            return await Promise.all(tasks);
        } catch (error) {
            logger.error("Failed to cancel all existing pending users", error);
            return []
        }
    }

    async findMostRecentReferrer(email: string): Promise<PendingUser | undefined> {
        logger.log("Attempting to find most recent referrers");
        try {
            const query = this.getCollectionRef()
            .where(PendingUser.Field.email, "==", email)
            .where(PendingUser.Field.status, "==", PendingUserStatus.PENDING)
            .orderBy(PendingUser.Field.magicLinkSentAt, QuerySortDirection.desc);

            const result = await AdminFirestoreService.getSharedInstance().executeQuery(query, PendingUser);
            const [mostRecent] = result.results;
            logger.log("Fetched most recent referrers", mostRecent);
            return mostRecent;
        } catch (e) {
            logger.error("Failed to get most recent referrers", e);
            return;
        }

    }

    async completeSignupForPendingUser(args: { pendingUser: PendingUser, userId: string }, options?: QueryOptions): Promise<PendingUser> {
        const { userId, pendingUser } = args;
        logger.log("Found pending user for email", pendingUser);
        pendingUser.signupCompletedAt = new Date();
        pendingUser.signupCompleted = true;
        pendingUser.userId = userId;
        pendingUser.status = PendingUserStatus.COMPLETED;
        return await this.save(pendingUser, options);
    }

    async completeSignup(args: { userId: string, email: string }, options?: QueryOptions): Promise<PendingUser | undefined> {
        const { email, userId } = args;

        const transaction = options && options.transaction;

        const transactionJob = async (t: Transaction) => {
            const pendingUser = await this.getPendingByEmail(email, { transaction: t });
            if (pendingUser) {
                logger.log("Found pending user for email", email, pendingUser);
                pendingUser.signupCompletedAt = new Date();
                pendingUser.signupCompleted = true;
                pendingUser.userId = userId;
                pendingUser.status = PendingUserStatus.COMPLETED;
                return await this.save(pendingUser, { transaction: t });
            } else {
                logger.log("No pending user was found for email", email);
            }
            return
        };

        if (transaction) {
            logger.log("Using existing transaction to run pending user job");
            await transactionJob(transaction)
        } else {
            await firestoreService.firestore.runTransaction(transactionJob);
        }
        return;
    }

    async deletePermanentlyForEmail(email: string): Promise<number> {
        const query = this.getCollectionRef()
        .where(PendingUser.Field.email, "==", email);
        // let deleteTasks: Promise<PendingUser | undefined>[] = [];
        return await firestoreService.deletePermanentlyForQuery(query)
    }
}