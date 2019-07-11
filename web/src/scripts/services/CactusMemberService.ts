import FirestoreService, {ListenerUnsubscriber, Query} from "@web/services/FirestoreService";
import CactusMember, {Field} from "@shared/models/CactusMember";
import {Collection} from "@shared/FirestoreBaseModels";
import {getAuth, Unsubscribe} from "@web/firebase";

export default class CactusMemberService {
    public static sharedInstance = new CactusMemberService();
    firestoreService = FirestoreService.sharedInstance;

    authUnsubscriber?: Unsubscribe;
    protected currentMemberUnsubscriber?: ListenerUnsubscriber;
    protected currentMember?: CactusMember;

    constructor() {
        this.authUnsubscriber = getAuth().onAuthStateChanged(async user => {
            if (this.currentMemberUnsubscriber) {
                this.currentMemberUnsubscriber();
            }

            if (user) {
                this.currentMemberUnsubscriber = this.observeByUserId(user.uid, {
                    onData: member => {
                        console.log("********* Got current cactus member", member);
                        this.currentMember = member;
                    }
                })
            } else {
                console.log("***** *unsetting current cactus member");
                this.currentMember = undefined;
            }
        });
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

    async save(model: CactusMember): Promise<CactusMember> {
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
}



