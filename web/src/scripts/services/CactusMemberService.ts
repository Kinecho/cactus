import FirestoreService, {ListenerUnsubscriber, Query} from "@web/services/FirestoreService";
import CactusMember, {Field} from "@shared/models/CactusMember";
import {Collection} from "@shared/FirestoreBaseModels";
import {FirebaseUser, getAuth, Unsubscribe} from "@web/firebase";
import {getDeviceLocale, getDeviceTimeZone} from "@web/DeviceUtil";
import Logger from "@shared/Logger";
import StorageService, {LocalStorageKey} from "@web/services/StorageService";

const logger = new Logger("CactusMemberService");

export default class CactusMemberService {
    public static sharedInstance = new CactusMemberService();
    firestoreService = FirestoreService.sharedInstance;

    authUnsubscriber?: Unsubscribe;
    protected currentMemberUnsubscriber?: ListenerUnsubscriber;
    protected currentMember?: CactusMember;
    protected memberHasLoaded = false;

    constructor() {
        this.authUnsubscriber = getAuth().onAuthStateChanged(async user => {
            if (this.currentMemberUnsubscriber) {
                this.currentMemberUnsubscriber();
            }

            if (user) {
                this.currentMemberUnsubscriber = this.observeByUserId(user.uid, {
                    onData: async member => {
                        logger.info("Current CactusMember", member);
                        this.currentMember = member;
                        this.memberHasLoaded = true;
                        await this.updateMemberSettingsIfNeeded(member)
                    }
                })
            } else {
                logger.info("unsetting current cactus member");
                this.currentMember = undefined;
            }
        });
    }

    /**
     * Update things like timezone if needed
     * @return {Promise<void>}
     */
    async updateMemberSettingsIfNeeded(member?: CactusMember): Promise<CactusMember | undefined> {
        if (!member) {
            return;
        }
        const zoneName = getDeviceTimeZone();
        const localeName = getDeviceLocale();
        let doSave = false;
        //Only update timezone if the member doesn't have one set
        if (zoneName && !member.timeZone) {
            member.timeZone = zoneName;
            doSave = true
        }

        //only update locale if no locale is present
        if (localeName && !member.locale) {
            member.locale = localeName;
            doSave = true
        }

        const fcmToken = StorageService.getString(LocalStorageKey.androidFCMToken);
        const currentTokens: string[] = member.fcmTokens ?? [];
        if (fcmToken && !currentTokens.includes(fcmToken)) {
            console.log("Adding FCM token to member");
            currentTokens.push(fcmToken);
            member.fcmTokens = currentTokens;
            doSave = true;
        }

        if (doSave) {
            logger.log("Updating member settings");
            await this.save(member)
        }

    }

    async registerFCMToken(token: string) {
        const member = this.currentMember;
        if (!member) {
            logger.info("No cactus member found, not registering token");
            return;
        }
        const currentTokens: string[] = member.fcmTokens ?? [];
        if (!currentTokens.includes(token)) {
            currentTokens.push(token);
            member.fcmTokens = currentTokens;
            await this.save(member);
            logger.info("Saved token to member");
        }
    }

    getCurrentCactusMember(): CactusMember | undefined {
        return this.currentMember;
    }

    getCollectionRef() {
        return this.firestoreService.getCollectionRef(Collection.members);
    }

    async executeQuery(query: Query) {
        return this.firestoreService.executeQuery(query, CactusMember);
    }

    async getFirst(query: Query) {
        return this.firestoreService.getFirst(query, CactusMember);
    }

    async save(model: CactusMember): Promise<CactusMember | undefined> {
        return this.firestoreService.save(model);
    }

    async getById(id: string): Promise<CactusMember | undefined> {
        return await this.firestoreService.getById(id, CactusMember);
    }

    observeByUserId(userId: string, options: { onData: (cactusMember?: CactusMember) => void }): ListenerUnsubscriber {
        const query = this.getCollectionRef().where(Field.userId, "==", userId);
        return this.firestoreService.observeFirst(query, CactusMember, options);
    }

    async getByUserId(userId: string): Promise<CactusMember | undefined> {
        const query = this.getCollectionRef().where(Field.userId, "==", userId);
        return await this.getFirst(query);
    }

    observeCurrentMember(options: { onData: (args: { user: FirebaseUser | undefined, member: CactusMember | undefined }) => void }): ListenerUnsubscriber {
        let memberUnsubscriber: ListenerUnsubscriber | undefined;
        const authUnsubscriber = getAuth().onAuthStateChanged(async user => {
            //reset subscriber
            if (memberUnsubscriber) {
                memberUnsubscriber();
                memberUnsubscriber = undefined;
            }
            if (user) {
                memberUnsubscriber = this.observeByUserId(user.uid, {
                    onData: (member) => {
                        options.onData({user: user, member: member})
                    }
                })
            } else {
                options.onData({user: undefined, member: undefined});
            }
        });

        return () => {
            authUnsubscriber();
            if (memberUnsubscriber) {
                memberUnsubscriber();
            }
        }
    }
}



