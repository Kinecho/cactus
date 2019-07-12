require("module-alias/register");
import {initializeServices} from "@shared/services/AdminServiceConfig";

import * as admin from "firebase-admin";
import {getConfig} from "@api/config/configService";

admin.initializeApp();
const app = admin.app();
const config = getConfig();

initializeServices(config, app, admin.firestore.Timestamp);

/**
 * this is a special pass-through file to ensure we require & register the module alias mapper before any other code.
 * This file should not need to be updated. To add new functions, see functions/src/index.ts
 */
const {cloudFunctions} = require("./index");

module.exports = cloudFunctions;