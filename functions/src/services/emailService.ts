import EmailReply from "@shared/models/EmailReply";
import FirestoreService from "@admin/services/AdminFirestoreService";
import Logger from "@shared/Logger";
const logger = new Logger("emailService.ts");

export async function saveEmailReply(email: EmailReply): Promise<EmailReply | undefined> {
    const firestoreService = FirestoreService.getSharedInstance();
    try {
        const result = await firestoreService.save(email);
        logger.log("saved email to firestore", result.toJSON());
        return result;
    } catch (error) {
        logger.error("Failed to write document", error);
        return undefined;
    }
}