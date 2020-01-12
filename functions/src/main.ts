require("module-alias/register");
import {initializeServices} from "@admin/services/AdminServiceConfig";
import * as admin from "firebase-admin";
import {getConfig} from "@admin/config/configService";

const config = getConfig();
const serviceAccount: admin.ServiceAccount = {
    privateKey: config.admin.service_account.private_key,
    projectId: config.admin.service_account.project_id,
    clientEmail: config.admin.service_account.client_email,
};
const credential = admin.credential.cert(serviceAccount);
admin.initializeApp({credential});
const app = admin.app();
const functionName = process.env.FUNCTION_NAME || undefined;
initializeServices(config, app, admin.firestore.Timestamp, functionName);

/**
 * this is a special pass-through file to ensure we require & register the module alias mapper before any other code.
 * This file should not need to be updated. To add new functions, see functions/src/index.ts
 */
const {cloudFunctions} = require("./index");

module.exports = cloudFunctions;