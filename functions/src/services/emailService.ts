import EmailReply from "@shared/models/EmailReply";
import FirestoreService from "@shared/services/AdminFirestoreService";


export async function saveEmailReply(email: EmailReply): Promise<EmailReply | undefined> {
    const firestoreService = FirestoreService.getSharedInstance();
    try {
        const result = await firestoreService.save(email);
        console.log("saved email to firestore", result.toJSON());
        return result;
    } catch (error) {
        console.error("Failed to write document", error);
        return undefined;
    }
}