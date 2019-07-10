import FirestoreService, {Query} from "@web/services/FirestoreService";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import {Collection} from "@shared/FirestoreBaseModels";

export default class ReflectionPromptService {
    public static sharedInstance = new ReflectionPromptService();
    firestoreService = FirestoreService.sharedInstance;

    getCollectionRef(){
        return this.firestoreService.getCollectionRef(Collection.reflectionPrompt)
    }

    async executeQuery(query: Query) {
        return this.firestoreService.executeQuery(query, ReflectionPrompt);
    }

    async getFirst(query: Query) {
        return this.firestoreService.getFirst(query, ReflectionPrompt);
    }

    async save(model:ReflectionPrompt):Promise<ReflectionPrompt> {
        return this.firestoreService.save(model);
    }

    async getById(id:string):Promise<ReflectionPrompt|undefined>{
        return await this.firestoreService.getById(id, ReflectionPrompt);
    }

}



