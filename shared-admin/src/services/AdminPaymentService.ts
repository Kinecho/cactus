import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import Payment from "@shared/models/Payment";
import {Collection} from "@shared/FirestoreBaseModels";


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

}