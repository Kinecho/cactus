import AdminFirestoreService, { GetBatchOptions } from "@admin/services/AdminFirestoreService";
import Payment from "@shared/models/Payment";
import { Collection } from "@shared/FirestoreBaseModels";
import { QuerySortDirection } from "@shared/types/FirestoreConstants";


export default class AdminPaymentService {
    protected static sharedInstance:AdminPaymentService;
    firestoreService:AdminFirestoreService;

    static getSharedInstance():AdminPaymentService {
        if (!AdminPaymentService.sharedInstance){
            throw new Error("No shared instance available. Ensure you initialize AdminPaymentService before using it");
        }
        return AdminPaymentService.sharedInstance;
    }

    static initialize(){
        AdminPaymentService.sharedInstance = new AdminPaymentService();
    }

    constructor() {
        this.firestoreService = AdminFirestoreService.getSharedInstance();
    }

    getCollectionRef() {
        return this.firestoreService.getCollectionRef(Collection.payments);
    }

    async save(model:Payment):Promise<Payment> {
        return this.firestoreService.save(model);
    }

    async getById(id:string):Promise<Payment|undefined>{
        return await this.firestoreService.getById(id, Payment);
    }

    async getAllForMemberId(memberId?: string): Promise<Payment[]> {
        if (!memberId) {
            return []
        }

        const query = this.getCollectionRef().where(Payment.Fields.memberId, "==", memberId);
        const queryResult = await this.firestoreService.executeQuery(query, Payment);
        return queryResult.results;
    }

    async getByAppleOriginalTransactionId(transactionId?: string): Promise<Payment[]> {
        if (!transactionId) {
            return [];
        }
        const query = this.getCollectionRef().where(Payment.Fields.appleOriginalTransactionId, "==", transactionId);
        const queryResult = await this.firestoreService.executeQuery(query, Payment);
        return queryResult.results;
    }

    async getAllAppleTransactionsBatch(options: GetBatchOptions<Payment>): Promise<void> {
        const query = this.getCollectionRef()

        await this.firestoreService.executeBatchedQuery({
            query,
            type: Payment,
            onData: options.onData,
            batchSize: options?.batchSize,
            orderBy: Payment.Fields.appleOriginalTransactionId,
            sortDirection: QuerySortDirection.asc,
            includeDeleted: true,
        });
        return;
    }

    async getAllGoogleTransactionsBatch(options: GetBatchOptions<Payment>): Promise<void> {
        const query = this.getCollectionRef()

        await this.firestoreService.executeBatchedQuery({
            query,
            type: Payment,
            onData: options.onData,
            batchSize: options?.batchSize,
            orderBy: Payment.Fields.googlePurchaseToken,
            sortDirection: QuerySortDirection.asc,
            includeDeleted: true,
        });
        return;
    }

    async getAllStripeTransactionsBatch(options: GetBatchOptions<Payment>): Promise<void> {
        const query = this.getCollectionRef()

        await this.firestoreService.executeBatchedQuery({
            query,
            maxBatches: options.maxBatches,
            type: Payment,
            onData: options.onData,
            batchSize: options?.batchSize,
            orderBy: Payment.Fields.stripeCheckoutSessionId,
            sortDirection: QuerySortDirection.asc,
            includeDeleted: true,
        });
        return;
    }

    async getByGooglePurchaseToken(purchaseToken?: string) : Promise<Payment[]> {
        if (!purchaseToken) {
            return []
        }

        const query = this.getCollectionRef().where(Payment.Fields.googlePurchaseToken, "==", purchaseToken);
        const queryResult = await this.firestoreService.executeQuery(query, Payment);
        return queryResult.results;
    }
}