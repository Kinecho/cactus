import FirestoreService, { DocumentReference, ListenerUnsubscriber, Query } from "@web/services/FirestoreService";
import CactusMember, { Field } from "@shared/models/CactusMember";
import { Collection } from "@shared/FirestoreBaseModels";
import { FirebaseUser, getAuth, Unsubscribe } from "@web/firebase";
import { getDeviceLocale, getDeviceTimeZone, getUserAgent, isAndroidApp } from "@web/DeviceUtil";
import Logger from "@shared/Logger";
import StorageService, { LocalStorageKey } from "@web/services/StorageService";
import { CactusElement } from "@shared/models/CactusElement";
import RevenueCatService from "@web/services/RevenueCatService";
import JournalFeedDataSource from "@web/datasource/JournalFeedDataSource";
import PromotionalOfferManager from "@web/managers/PromotionalOfferManager";

const logger = new Logger("CactusMemberService");

export type AuthAction = (params: { member: CactusMember }) => Promise<any>;

export default class CactusMemberService {
    public static sharedInstance = new CactusMemberService();
    firestoreService = FirestoreService.sharedInstance;

    authUnsubscriber?: Unsubscribe;
    protected currentMemberUnsubscriber?: ListenerUnsubscriber;
    currentMember?: CactusMember;
    currentUser?: FirebaseUser | null;
    protected memberHasLoaded = false;

    pendingLoginActions: AuthAction[] = []
    ready: Promise<void>;

    private onStart!: () => void;

    get isLoggedIn(): boolean {
        return !!this.currentMember;
    }

    constructor() {
        this.ready = new Promise(resolve => {
            this.onStart = resolve;
        })
        this.authUnsubscriber = getAuth().onAuthStateChanged(async user => {
            if (this.currentMemberUnsubscriber) {
                this.currentMemberUnsubscriber();
                this.currentMember = undefined;
            }
            this.currentUser = user;
            if (user) {
                this.currentMemberUnsubscriber = this.observeByUserId(user.uid, {
                    onData: async member => {
                        logger.info("Member update received from server");
                        const memberChanged = this.currentMember?.id !== member?.id
                        this.currentMember = member;
                        this.memberHasLoaded = true;
                        this.onStart();
                        if (member && memberChanged) {
                            logger.info("Member changed - updating member values like timezone, revenuecat + session offers");
                            const dataSource = JournalFeedDataSource.setup(member, { onlyCompleted: true });
                            await Promise.all([
                                this.updateMemberSettingsIfNeeded(member),
                                RevenueCatService.shared.updateLastSeen(member),
                                this.processActions(member),
                                PromotionalOfferManager.shared.applySessionOffers(member),
                                dataSource.start(),
                            ]);
                        }
                    }
                })
            } else {
                this.onStart();
                this.currentMember = undefined;
            }
        });
    }

    async authReady(): Promise<void> {
        if (this.memberHasLoaded) {
            return;
        }
        await this.getCurrentMember()
        return;
    }

    async addAuthAction(action: AuthAction) {
        if (this.currentMember) {
            logger.info("add action - Processing immediately")
            await action({ member: this.currentMember });
        } else {
            logger.info("added auth action, not processing yet");
            this.pendingLoginActions.push(action);
        }
    }

    protected async processActions(member: CactusMember): Promise<void> {
        logger.info(`Processing ${ this.pendingLoginActions.length } auth actions`);
        let action = this.pendingLoginActions.shift();
        while (action) {
            try {
                await action({ member });
            } catch (error) {
                logger.error("Failed to process pending action", error);
            } finally {
                action = this.pendingLoginActions.shift();
            }
        }
    }

    /**
     * Update things like timezone if needed
     * @return {Promise<void>}
     */
    async updateMemberSettingsIfNeeded(member?: CactusMember): Promise<CactusMember | undefined> {
        try {
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
                StorageService.removeItem(LocalStorageKey.androidFCMToken);
                doSave = true;
            }

            if (doSave) {
                logger.log("[update settings if needed] member trial started at type of = ", typeof (member.subscription?.trial?.startedAt))
                logger.log("Updating member settings for member", member);

                await this.save(member)
            }
        } catch (error) {
            logger.error("Failed to update member settings, an unexpected error occurred", error);
            return;
        }
    }

    async registerFCMToken(token: string) {
        const member = this.currentMember;
        if (!member) {
            logger.info("No cactus member found, not registering token");
            return;
        }

        if (!isAndroidApp()) {
            logger.warn(`User agent not allowed: ${ getUserAgent() }`);
            return;
        }

        const currentTokens: string[] = member.fcmTokens ?? [];
        if (!currentTokens.includes(token)) {
            currentTokens.push(token);
            member.fcmTokens = currentTokens;
            await this.save(member);
            StorageService.removeItem(LocalStorageKey.androidFCMToken);
            logger.info("Saved token to member");
        }
    }

    /**
     * Get the current cactus member. Will wait to fetch from database if the member hasn't loaded yet.
     * @return {Promise<CactusMember | undefined>}
     */
    async getCurrentMember(): Promise<CactusMember | undefined> {
        if (this.currentMember) {
            return this.currentMember;
        }

        return new Promise<CactusMember | undefined>(resolve => {
            const authUnsubscriber = getAuth().onAuthStateChanged(async user => {
                authUnsubscriber();
                this.currentUser = user;
                if (user) {
                    const member = await this.getByUserId(user.uid);
                    this.currentMember = member;
                    this.memberHasLoaded = true;
                    resolve(member);
                } else {
                    resolve(undefined)
                }
            });
        })

    }

    getCollectionRef() {
        return this.firestoreService.getCollectionRef(Collection.members);
    }

    getMemberRef(member?: CactusMember): DocumentReference | undefined {
        if (!member?.id) {
            return undefined;
        }
        return this.getCollectionRef().doc(member.id);
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
        //Give instant feedback if the member has already been loaded
        if (this.memberHasLoaded) {
            options.onData({ member: this.currentMember, user: this.currentUser ?? undefined })
        }
        const authUnsubscriber = getAuth().onAuthStateChanged(async user => {
            //reset subscriber
            if (memberUnsubscriber) {
                memberUnsubscriber();
                memberUnsubscriber = undefined;
            }
            if (user) {
                memberUnsubscriber = this.observeByUserId(user.uid, {
                    onData: (member) => {
                        options.onData({ user: user, member: member })
                    }
                })
            } else {
                options.onData({ user: undefined, member: undefined });
            }
        });

        return () => {
            authUnsubscriber();
            if (memberUnsubscriber) {
                memberUnsubscriber();
            }
        }
    }

    async setFocusElement(params: { element: CactusElement | null, member?: CactusMember }): Promise<void> {
        const member = params.member ?? this.currentMember;
        const ref = this.getMemberRef(member);
        if (!ref) {
            return;
        }
        await ref.update({ [CactusMember.Field.focusElement]: params.element });
    }

    async signOut() {
        JournalFeedDataSource.current?.stop();
        this.currentMemberUnsubscriber?.()
        await getAuth().signOut();
    }
}