import {save} from "@api/services/firestoreService";
import EmailReply from "@shared/models/EmailReply";
// import {Collection} from "@shared/FirestoreBaseModels";


export async function saveEmailReply(email:EmailReply):Promise<boolean>{
    // const replies = getCollectionRef(Collection.emailReply);

    try {
        // const result = await replies.add(JSON.parse(JSON.stringify(email)));
        const result = await save(email);
        console.log("saved email to firestore", result.toJSON());
        return true;
    } catch (error){
        console.error("Failed to write document", error);
        return false;
    }
}