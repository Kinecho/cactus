import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import PendingUser, {PendingUserStatus} from "@shared/models/PendingUser";
import {Collection} from "@shared/FirestoreBaseModels";
import {QuerySortDirection} from "@shared/types/FirestoreConstants";

let firestoreService: AdminFirestoreService;

export interface PendingUserRequest {
    email: string,
    referredByEmail?: string,
    reflectionResponseIds?: string[],
    queryParams?: { [name: string]: string },
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

    async save(model: PendingUser): Promise<PendingUser> {
        return firestoreService.save(model);
    }

    async getById(id: string): Promise<PendingUser | undefined> {
        return await firestoreService.getById(id, PendingUser);
    }

    async getPendingByEmail(email: string): Promise<PendingUser | undefined> {
        try {
            const query = this.getCollectionRef()
                .where(PendingUser.Field.email, "==", email)
                .where(PendingUser.Field.status, "==", PendingUserStatus.PENDING)
                .orderBy(PendingUser.Field.magicLinkSentAt, QuerySortDirection.desc);

            return await AdminFirestoreService.getSharedInstance().getFirst(query, PendingUser);
        } catch (e) {
            console.error("Failed to execute getPendingByEmail", e);
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
        const {email, referredByEmail, reflectionResponseIds = [], queryParams = {}} = args;
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
            pendingUser.queryParams = {...recentReferrer.queryParams, ...queryParams};
            console.log("merged query params into ", pendingUser.queryParams)
        }

        pendingUser.status = PendingUserStatus.PENDING;
        pendingUser.magicLinkSentAt = new Date();
        const savedPending = await this.save(pendingUser);
        console.log("Saved pending user", savedPending);
        return savedPending;

    }

    async cancelAllPending(email: string): Promise<PendingUser[]> {
        console.log("attempting to cancel all pending users");
        try {
            const query = this.getCollectionRef()
                .where(PendingUser.Field.email, "==", email)
                .where(PendingUser.Field.status, "==", PendingUserStatus.PENDING);

            const now = new Date();
            const results = await AdminFirestoreService.getSharedInstance().executeQuery(query, PendingUser);
            console.log("got pending results", results.size);
            const tasks = results.results.map(pending => {
                pending.signupCanceledAt = now;
                pending.status = PendingUserStatus.CANCELED;
                return this.save(pending)
            });
            console.log("awaiting all update tasks");
            return await Promise.all(tasks);
        } catch (error) {
            console.error("Failed to cancel all existing pending users", error);
            return []
        }
    }

    async findMostRecentReferrer(email: string): Promise<PendingUser | undefined> {
        console.log("Attempting to find most recent referrers");
        try {
            const query = this.getCollectionRef()
                .where(PendingUser.Field.email, "==", email)
                .where(PendingUser.Field.status, "==", PendingUserStatus.PENDING)
                .orderBy(PendingUser.Field.magicLinkSentAt, QuerySortDirection.desc);

            const result = await AdminFirestoreService.getSharedInstance().executeQuery(query, PendingUser);
            const [mostRecent] = result.results;
            console.log("Fetched most recent referrers", mostRecent);
            return mostRecent;
        } catch (e) {
            console.error("Failed to get most recent referrers", e);
            return;
        }

    }

    async completeSignup(args: { userId: string, email: string }): Promise<PendingUser | undefined> {
        const {email, userId} = args;
        const pendingUser = await this.getPendingByEmail(email);
        if (pendingUser) {
            pendingUser.signupCompletedAt = new Date();
            pendingUser.signupCompleted = true;
            pendingUser.userId = userId;
            pendingUser.status = PendingUserStatus.COMPLETED;
            return await this.save(pendingUser);
        }

        return;
    }

}