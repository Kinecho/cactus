import * as admin from 'firebase-admin'
import {CactusConfig} from "@shared/CactusConfig";
import MailchimpService from "@admin/services/MailchimpService";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import AdminUserService from "@admin/services/AdminUserService";
import AdminSentPromptService from "@admin/services/AdminSentPromptService";
import AdminReflectionPromptService from "@admin/services/AdminReflectionPromptService";
import AdminSlackService from "@admin/services/AdminSlackService";
import {setTimestamp} from "@shared/util/FirestoreUtil";
import AdminSentCampaignService from "@admin/services/AdminSentCampaignService";
import AdminSendgridService from "@admin/services/AdminSendgridService";
import AdminPendingUserService from "@admin/services/AdminPendingUserService";
import GoogleSheetsService from "@admin/services/GoogleSheetsService";
import * as Sentry from "@sentry/node";
import chalk from "chalk";
import AdminFlamelinkService from "@admin/services/AdminFlamelinkService";
import AdminPromptContentService from "@admin/services/AdminPromptContentService";
import AdminReflectionResponseService from "@admin/services/AdminReflectionResponseService";
import AdminEmailReplyService from "@admin/services/AdminEmailReplyService";
import AdminSocialInviteService from "@admin/services/AdminSocialInviteService";
import AdminMemberProfileService from "@admin/services/AdminMemberProfileService";
import AdminSocialActivityService from "@admin/services/AdminSocialActivityService";
import AdminSocialConnectionService from "@admin/services/AdminSocialConnectionService";
import AdminSocialConnectionRequestService from "@admin/services/AdminSocialConnectionRequestService";
import Logger from "@shared/Logger";
const logger = new Logger("AdminServiceConfig");
export function initializeServices(config: CactusConfig, app: admin.app.App, timestampClass: any, functionName: string | undefined) {
    logger.log(chalk.green("initializing all services"));
    setTimestamp(timestampClass || admin.firestore.Timestamp);

    //Firestore
    AdminFirestoreService.initialize(app);
    AdminSendgridService.initialize(config);
    AdminSlackService.initialize(config);
    MailchimpService.initialize(config);
    AdminCactusMemberService.initialize();
    AdminUserService.initialize(config);
    AdminReflectionPromptService.initialize();
    AdminReflectionResponseService.initialize();
    AdminSentPromptService.initialize();
    AdminPendingUserService.initialize();
    AdminSentCampaignService.initialize();
    GoogleSheetsService.initialize(config);
    AdminEmailReplyService.initialize();
    AdminSocialInviteService.initialize(config);
    AdminMemberProfileService.initialize();
    AdminSocialActivityService.initialize();
    AdminSocialConnectionService.initialize();
    AdminSocialConnectionRequestService.initialize();

    //Flamelink
    AdminFlamelinkService.initialize(config, app);
    AdminPromptContentService.initialize();


    logger.log("Initializing Sentry");
    const sentryOptions: Sentry.NodeOptions = {
        dsn: config.sentry.functions_dsn,
        environment: config.app.environment,
        release: config.sentry.release,
        serverName: functionName || "unknown"
    };

    Sentry.init(sentryOptions);


}