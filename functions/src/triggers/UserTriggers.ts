import * as admin from "firebase-admin";
import AdminUserService from "@admin/services/AdminUserService";
import AdminSlackService from "@admin/services/AdminSlackService";
import Logger from "@shared/Logger";

const logger = new Logger("UserTriggers");

/**
 * Delete a user from the auth. This will clean up related records and send a slack notification.
 * @param {admin.auth.UserRecord} user
 * @return {Promise<void>}
 */
export async function onDelete(user: admin.auth.UserRecord) {
    const email = user.email;
    logger.log("Deleting user ", JSON.stringify(user.toJSON()));
    if (!email) {
        logger.error("No email found on the user, can't delete.");
        await AdminSlackService.getSharedInstance().sendCustomerSupportMessage(`:warning: User deleted but no email address found. \`\`\`\n${user.toJSON()}\`\`\``);
        return
    }
    try {
        await AdminUserService.getSharedInstance().deleteAllDataPermanently({email, userRecord: user});
        logger.log("finished deleting user with email", email);
    } catch (error) {
        logger.error("Failed to delete user data", error);
        await AdminSlackService.getSharedInstance().sendCustomerSupportMessage(`:warning: User deleted but no email found. \`\`\`\n${error.message}\`\`\``);
    }
}