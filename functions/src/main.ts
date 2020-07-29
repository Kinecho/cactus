require("module-alias/register");
import { initializeServices } from "@admin/services/AdminServiceConfig";
import { configureLogger } from "@api/util/CloudLogger";
import * as admin from "firebase-admin";
import { getConfig } from "@admin/config/configService";

configureLogger();

admin.initializeApp();
const app = admin.app();
const config = getConfig();
const functionName = process.env.FUNCTION_NAME || undefined;
initializeServices(config, app, admin.firestore.Timestamp, functionName);

/**
 * this is a special pass-through file to ensure we require & register the module alias mapper before any other code.
 * This file should not need to be updated. To add new functions, see functions/src/index.ts
 */
const {cloudFunctions} = require("./index");

module.exports = cloudFunctions;