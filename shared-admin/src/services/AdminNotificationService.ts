import AdminFirestoreService, { GetOptions, SaveOptions } from "@admin/services/AdminFirestoreService";
import Notification, { FindNotificationParams } from "@shared/models/Notification";
import { Collection } from "@shared/FirestoreBaseModels";
import admin from "firebase-admin";
import CollectionReference = admin.firestore.CollectionReference;


export default class AdminNotificationService {
    protected static sharedInstance: AdminNotificationService;

    static getSharedInstance(): AdminNotificationService {
        if (!AdminNotificationService.sharedInstance) {
            throw new Error("No shared instance available. Ensure you initialize AdminNotificationService before using it");
        }
        return AdminNotificationService.sharedInstance;
    }

    static initialize() {
        AdminNotificationService.sharedInstance = new AdminNotificationService();
    }

    firestoreService: AdminFirestoreService;

    constructor() {
        this.firestoreService = AdminFirestoreService.getSharedInstance();
    }

    collectionRef(): CollectionReference {
        return this.firestoreService.getCollectionRef(Collection.notifications);
    }

    async save(model: Notification, options?: SaveOptions): Promise<Notification> {
        return this.firestoreService.save(model, options);
    }

    async getById(id: string): Promise<Notification | undefined> {
        return await this.firestoreService.getById(id, Notification);
    }

    async findFirst(params: FindNotificationParams, options?: GetOptions): Promise<Notification | undefined> {
        const { uniqueBy, channel, memberId, type, contentId, contentType } = params;
        let query = this.collectionRef()
        .where(Notification.Fields.channel, "==", channel)
        .where(Notification.Fields.memberId, "==", memberId)
        .where(Notification.Fields.type, "==", type)

        if (uniqueBy) {
            query = query.where(Notification.Fields.uniqueBy, "==", uniqueBy);
        }

        if (contentId) {
            query = query.where(Notification.Fields.contentId, "==", contentId);
        }

        if (contentType) {
            query = query.where(Notification.Fields.contentType, "==", contentType);
        }

        query = query.limit(1);

        return await this.firestoreService.getFirst(query, Notification, { ...options, includeDeleted: true });
    }

}