import {Collection, getCollectionRef} from "@api/services/firestoreService";
import Email from "@api/inbound/models/Email";


export async function logEmailReply(email:Email):Promise<boolean>{
    const replies = getCollectionRef(Collection.emailReply);

    try {
        const result = await replies.add(JSON.parse(JSON.stringify(email)));
        console.log("saved email to firestore", result);
        return true;
    } catch (error){
        console.error("Failed to write document", error);
        return false;
    }
}