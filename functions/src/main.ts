require("module-alias/register");
import { initializeServices } from "@admin/services/AdminServiceConfig";
import { configureLogger } from "@api/util/CloudLogger";
import * as admin from "firebase-admin";
import { getConfig } from "@admin/config/configService";


// This allows TypeScript to detect our global value
declare global {
    namespace NodeJS {
        interface Global {
            __rootdir__: string;
        }
    }
}

global.__rootdir__ = __dirname || process.cwd();

const config = getConfig();
configureLogger(config);
admin.initializeApp();
const app = admin.app();
initializeServices(config, app, admin.firestore.Timestamp);

/**
 * this is a special pass-through file to ensure we require & register the module alias mapper before any other code.
 * This file should not need to be updated. To add new functions, see functions/src/index.ts
 */
const { cloudFunctions } = require("./index");

module.exports = cloudFunctions;