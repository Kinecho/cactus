import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import CheckoutSession from "@shared/models/CheckoutSession";
import Logger from "@shared/Logger";

const logger = new Logger("AdminCheckoutSessionService");

export default class AdminCheckoutSessionService {
    protected static sharedInstance: AdminCheckoutSessionService;
    firestoreService: AdminFirestoreService;

    static getSharedInstance(): AdminCheckoutSessionService {
        if (!AdminCheckoutSessionService.sharedInstance) {
            throw new Error("No shared instance available. Ensure you initialize AdminCheckoutSessionService before using it");
        }
        return AdminCheckoutSessionService.sharedInstance;
    }

    static initialize() {
        logger.info("Initializing AdminCheckoutSessionsService");
        AdminCheckoutSessionService.sharedInstance = new AdminCheckoutSessionService();
    }

    constructor() {
        this.firestoreService = AdminFirestoreService.getSharedInstance();
    }

    async save(model: CheckoutSession): Promise<CheckoutSession> {
        return this.firestoreService.save(model);
    }

    async getById(id: string): Promise<CheckoutSession | undefined> {
        return await this.firestoreService.getById(id, CheckoutSession);
    }

}