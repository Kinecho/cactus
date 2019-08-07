import * as admin from 'firebase-admin'
import {CactusConfig} from "@shared/CactusConfig";
import MailchimpService from "@shared/services/MailchimpService";
import AdminFirestoreService from "@shared/services/AdminFirestoreService";
import AdminCactusMemberService from "@shared/services/AdminCactusMemberService";
import AdminUserService from "@shared/services/AdminUserService";
import AdminSentPromptService from "@shared/services/AdminSentPromptService";
import AdminReflectionPromptService from "@shared/services/AdminReflectionPromptService";
import AdminSlackService from "@shared/services/AdminSlackService";
import {setTimestamp} from "@shared/util/FirestoreUtil";
import AdminSentCampaignService from "@shared/services/AdminSentCampaignService";
import AdminSendgridService from "@shared/services/AdminSendgridService";
import GoogleSheetsService from "@shared/services/GoogleSheetsService";
import * as Sentry from "@sentry/node";
import chalk from "chalk";

export function initializeServices(config: CactusConfig, app: admin.app.App, timestampClass: any, functionName: string | undefined) {
    console.log(chalk.green("initializing all services"));
    setTimestamp(timestampClass || admin.firestore.Timestamp);

    AdminFirestoreService.initialize(app);
    AdminSendgridService.initialize(config);
    AdminSlackService.initialize(config);
    MailchimpService.initialize(config);
    AdminCactusMemberService.initialize();
    AdminUserService.initialize(config);
    AdminReflectionPromptService.initialize();
    AdminSentPromptService.initialize();
    AdminSentCampaignService.initialize();
    GoogleSheetsService.initialize(config);


    console.log("Initializing Sentry");
    const sentryOptions: Sentry.NodeOptions = {
        dsn: config.sentry.functions_dsn,
        environment: config.app.environment,
        release: config.sentry.release,
        serverName: functionName || "unknown"
    };

    Sentry.init(sentryOptions);


}