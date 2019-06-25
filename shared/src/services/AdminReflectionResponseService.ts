import AdminFirestoreService from "@shared/services/AdminFirestoreService";
import ReflectionResponse from "@shared/models/ReflectionResponse";
import {Collection} from "@shared/FirestoreBaseModels";

const firestoreService = AdminFirestoreService.getSharedInstance();

export default class AdminReflectionResponseService {

    public static sharedInstance = new AdminReflectionResponseService();


    async save(model:ReflectionResponse):Promise<ReflectionResponse> {
        return firestoreService.save(model);
    }


    async getResponseForCampaignId(memberId:string, campaignId:string):Promise<ReflectionResponse> {
        const collection = firestoreService.getCollectionRef(Collection.reflectionResponses);
        // collection.where()
        console.log("getting response from collection", collection);

        throw new Error("Not implemented");
    }
}