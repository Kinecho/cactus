import AdminFirestoreService, {GetOptions, SaveOptions} from "@admin/services/AdminFirestoreService";
import User, {Field} from "@shared/models/User";
import * as admin from "firebase-admin";
import {Collection} from "@shared/FirestoreBaseModels";
import {CactusConfig} from "@shared/CactusConfig";

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

const DefaultSendMagicLinkOptions = {
    successPath: '/success',
};

let firestoreService: AdminFirestoreService;

export default class AdminUserService {
    config: CactusConfig;
    protected static sharedInstance: AdminUserService;

    constructor(config: CactusConfig) {
        this.config = config;
    }

    static getSharedInstance(): AdminUserService {
        if (!AdminUserService.sharedInstance) {
            throw new Error("No shared instance available. Ensure you initialize AdminUserService before using it");
        }
        return AdminUserService.sharedInstance;
    }

    static initialize(config: CactusConfig) {
        firestoreService = AdminFirestoreService.getSharedInstance();
        AdminUserService.sharedInstance = new AdminUserService(config);
    }

    getCollectionRef() {
        return AdminFirestoreService.getSharedInstance().getCollectionRef(Collection.users);
    }

    async save(model: User, options?: SaveOptions): Promise<User> {
        return firestoreService.save(model, options);
    }

    async getMagicLinkUrl(email: string, options: SendMagicLinkOptions = DefaultSendMagicLinkOptions): Promise<SendMagicLinkResult> {
        let successPath = options.successPath || DefaultSendMagicLinkOptions.successPath;
        if (successPath && successPath.length > 0 && !successPath.startsWith("/")) {
            successPath = `/${successPath}`
        }

        try {
            const signinUrl = await admin.auth().generateSignInWithEmailLink(email, {
                url: `${this.config.web.domain}${successPath}`,
                handleCodeInApp: true,
                dynamicLinkDomain: this.config.dynamic_links.domain,
            });
            return {success: true, signinUrl: signinUrl, email};
        } catch (e) {
            console.error("Failed to generate signin url", e);
            return {success: false, error: e, email};
        }
    }

    async getByEmail(email: string): Promise<User | undefined> {
        let searchEmail = email;
        if (email && email.trim()) {
            searchEmail = email.trim().toLowerCase();
        }


        const query = firestoreService.getCollectionRef(Collection.users).where(Field.email, "==", searchEmail).limit(1);
        const result = await firestoreService.executeQuery(query, User);

        const [foundUser] = result.results;

        return foundUser;
    }

    async getById(id?: string | undefined, options?: GetOptions): Promise<User | undefined> {
        if (!id) {
            return undefined;
        }
        return await firestoreService.getById(id, User, options);
    }

    /**
     * Logically delete the user and the corresponding member
     * @param {string} id
     * @return {Promise<User | undefined>}
     */
    async delete(id: string): Promise<User | undefined> {
        const deletedUser = await firestoreService.delete(id, User);

        return deletedUser;
    }

    async setReferredByEmail(args: { userId: string, referredByEmail?: string | undefined }) {
        //todo: Should this set the referred by on a document without knowing if it exists? what if it does exist?
        try {
            if (args.referredByEmail === undefined) {
                return;
            }

            const {userId, referredByEmail} = args;
            await this.getCollectionRef().doc(userId).set({[User.Field.referredByEmail]: referredByEmail}, {
                merge: true,
                mergeFields: [User.Field.referredByEmail]
            });
        } catch (e) {
            console.error("Failed to update referred by email");
        }

    }

}