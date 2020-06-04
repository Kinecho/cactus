import * as admin from 'firebase-admin'
import { CactusConfig } from "@shared/CactusConfig";
import MailchimpService from "@admin/services/MailchimpService";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import AdminUserService from "@admin/services/AdminUserService";
import AdminSentPromptService from "@admin/services/AdminSentPromptService";
import AdminReflectionPromptService from "@admin/services/AdminReflectionPromptService";
import AdminSlackService from "@admin/services/AdminSlackService";
import { setTimestamp } from "@shared/util/FirestoreUtil";
import AdminSentCampaignService from "@admin/services/AdminSentCampaignService";
import AdminSendgridService from "@admin/services/AdminSendgridService";
import AdminPendingUserService from "@admin/services/AdminPendingUserService";
import GoogleSheetsService from "@admin/services/GoogleSheetsService";
import GoogleLanguageService from "@admin/services/GoogleLanguageService";
import * as Sentry from "@sentry/node";
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
import AdminSubscriptionService from "@admin/services/AdminSubscriptionService";
import AdminCheckoutSessionService from "@admin/services/AdminCheckoutSessionService";
import AdminPaymentService from "@admin/services/AdminPaymentService";
import StripeWebhookService from "@admin/services/StripeWebhookService";
import AdminSubscriptionProductService from "@admin/services/AdminSubscriptionProductService";
import { PubSubService } from "@admin/pubsub/PubSubService";
import AdminEmailLogService from "@admin/services/AdminEmailLogService";
import AppleService from "@admin/services/AppleService";
import GooglePlayService from "@admin/services/GooglePlayService";
import StripeService from "@admin/services/StripeService";
import AdminDataExportService from "@admin/services/AdminDataExportService";
import AdminDeletedUserService from "@admin/services/AdminDeletedUserService";
import AdminRevenueCatService from "@admin/services/AdminRevenueCatService";

const logger = new Logger("AdminServiceConfig");

export function initializeServices(config: CactusConfig, app: admin.app.App, timestampClass: any, functionName: string | undefined) {
    logger.log("initializing all services");
    setTimestamp(timestampClass || admin.firestore.Timestamp);

    //Firestore
    AdminFirestoreService.initialize(app, config);

    //PubSub
    PubSubService.initialize(config);

    //Stripe
    StripeService.initialize(config);

    //model services
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
    GoogleLanguageService.initialize(config);
    AdminEmailReplyService.initialize();
    AdminSocialInviteService.initialize(config);
    AdminMemberProfileService.initialize();
    AdminSocialActivityService.initialize();
    AdminSocialConnectionService.initialize();
    AdminSocialConnectionRequestService.initialize();
    AdminSubscriptionService.initialize(config);
    AdminCheckoutSessionService.initialize();
    AdminPaymentService.initialize();
    StripeWebhookService.initialize(config);
    AdminEmailLogService.initialize(config);
    AdminDataExportService.initialize(config);
    AdminDeletedUserService.initialize();

    //Flamelink
    AdminFlamelinkService.initialize(config, app);
    AdminPromptContentService.initialize(config);
    AdminSubscriptionProductService.initialize();

    //Apple
    AppleService.initialize(config);

    //Google Play
    GooglePlayService.initialize(config);

    //RevenueCat
    AdminRevenueCatService.initialize(config);

    logger.log("Initializing Sentry");
    const sentryOptions: Sentry.NodeOptions = {
        dsn: config.sentry.functions_dsn,
        environment: config.app.environment,
        release: config.sentry.release,
        serverName: functionName || "unknown"
    };

    Sentry.init(sentryOptions);


}