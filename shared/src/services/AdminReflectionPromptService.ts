import AdminFirestoreService from "@shared/services/AdminFirestoreService";
import {Collection} from "@shared/FirestoreBaseModels";
import ReflectionPrompt, {Field} from "@shared/models/ReflectionPrompt";


const firestoreService = AdminFirestoreService.getSharedInstance();

export default class AdminReflectionPromptService {

    public static sharedInstance = new AdminReflectionPromptService();

    async getPromptForCampaignId(campaignId?:string):Promise<ReflectionPrompt|undefined> {
        if (!campaignId){
            return undefined;
        }

        const collection = firestoreService.getCollectionRef(Collection.reflectionPrompt);
        const query = collection.where(Field.campaignIds, "array-contains", campaignId);


        const {results, size} = await firestoreService.executeQuery(query, ReflectionPrompt);
        if (size > 1){
            console.warn("Found more than one question prompt for given campaign id");
        }

        const [prompt] = results;
        return prompt;
    }
}