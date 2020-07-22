import * as functions from 'firebase-functions';
import mailchimpApp from "@api/endpoints/mailchimpEndpoints";
import inboundApp from "@api/endpoints/inboundApp";
import checkoutApp from "@api/endpoints/checkoutEndpoints";
import manageNotificationApp from "@api/endpoints/manageNotificationsEndpoints";
import testApp from "@api/endpoints/testEndpoints";
import taskEndpoints from "@api/endpoints/taskEndpoints";
import * as DailySentPromptJob from "@api/pubsub/subscribers/DailySentPromptJob";
import { backupFirestore, exportFirestoreToBigQuery } from "@api/endpoints/DataExportJob";
import * as UnsubscriberReportSyncJob from "@api/pubsub/subscribers/UnsubscriberReportSyncJob";
import {
    onWriteReflectionResponse,

} from "@api/triggers/ReflectionResponseTriggers";
import * as SlackCommandJob from "@api/pubsub/subscribers/SlackCommandJob";
import * as MemberStatsJob from "@api/pubsub/subscribers/MemberStatsJob";
import * as CustomSentPromptNotificationsJob from "@api/pubsub/subscribers/CustomSentPromptNotificationsJob";
import { onDelete } from "@api/triggers/UserTriggers";
import { PubSubTopic } from "@shared/types/PubSubTypes";
import slackEndpoints from "@api/endpoints/slackEndpoints";
import signupEndpoints from "@api/endpoints/signupEndpoints";
import flamelinkEndpoints from "@api/endpoints/flamelinkEndpoints";
import socialEndpoints from "@api/endpoints/socialEndpoints";
import userEndpoints from "@api/endpoints/userEndpoints";
import appleEndpoints from "@api/endpoints/appleEndpoints"
import {
    updateMemberProfileTrigger,
    updatePromptSendTimeTrigger,
    updateSubscriptionDetailsTrigger,
} from "@api/triggers/MemberTriggers";
import * as PromptContentTriggers from "@api/triggers/PromptContentTriggers";
import { onPublish as expireMembershipJob } from "@api/pubsub/subscribers/ExpireMembershipTrialJob";
import { onPublish as syncTrailToMailchimpMembersJob } from "@admin/pubsub/SyncTrialMembersToMailchimpJob";
import { onPublish as GooglePlayBillingJob } from "@api/pubsub/subscribers/GooglePlayBillingListeners";
import { onPublish as RevenueCatEventJob } from "@api/pubsub/subscribers/RevenueCatPubSub";
import { transactionalOnCreate } from "@admin/AuthUserCreateJob";
import { onPublish as CancellationJob } from "@admin/pubsub/ProcessSubscriptionCancellations";
import { updateMemberCoreValueFromAssessment } from "@api/triggers/CoreValuesAssessessmentResponseTriggers";
import { gapAssessmentCompleted } from "@api/triggers/GapAnalysisTriggers";

export const cloudFunctions = {
    //API Endpoints
    checkout: functions.https.onRequest(checkoutApp),
    flamelink: functions.https.onRequest(flamelinkEndpoints),
    inbound: functions.https.onRequest(inboundApp),
    mailchimp: functions.https.onRequest(mailchimpApp),
    slack: functions.https.onRequest(slackEndpoints),
    signup: functions.https.onRequest(signupEndpoints),
    social: functions.https.onRequest(socialEndpoints),
    user: functions.runWith({ memory: "512MB", timeoutSeconds: 60 }).https.onRequest(userEndpoints),
    test: functions.runWith({ memory: "1GB", timeoutSeconds: 300 }).https.onRequest(testApp),
    notificationPreferences: functions.https.onRequest(manageNotificationApp),
    apple: functions.https.onRequest(appleEndpoints),
    tasks: functions.runWith({ memory: "1GB", timeoutSeconds: 120, maxInstances: 10 }).https.onRequest(taskEndpoints),

    //PubSub topics
    pubsub1: {
        backupFirestore: functions.pubsub.topic(PubSubTopic.firestore_backup).onPublish(backupFirestore),
        dailySentPromptJob: functions.runWith({
            memory: "2GB",
            timeoutSeconds: 540
        }).pubsub.topic(PubSubTopic.create_daily_sent_prompts).onPublish(DailySentPromptJob.onPublish),
        exportToBigQuery: functions.runWith({ timeoutSeconds: 540 }).pubsub.topic(PubSubTopic.firestore_export_bigquery).onPublish(exportFirestoreToBigQuery),
    },
    pubsub2: {
        slackCommandJob: functions.runWith({
            memory: "2GB",
            timeoutSeconds: 540
        }).pubsub.topic(PubSubTopic.slack_command).onPublish(SlackCommandJob.onPublish),
        unsubscriberSyncJob: functions.pubsub.topic(PubSubTopic.unsubscriber_sync).onPublish(UnsubscriberReportSyncJob.onPublish),
        memberStatsJob: functions.runWith({
            memory: "1GB",
            timeoutSeconds: 540
        }).pubsub.topic(PubSubTopic.member_stats_sync).onPublish(MemberStatsJob.onPublish),
        customSentPromptNotifications: functions.runWith({
            memory: "1GB",
            timeoutSeconds: 540
        }).pubsub.topic(PubSubTopic.custom_sent_prompt_notifications).onPublish(CustomSentPromptNotificationsJob.onPublish),
        expireTrials: functions.runWith({
            memory: "1GB",
            timeoutSeconds: 540
        }).pubsub.topic(PubSubTopic.expire_subscription_trials).onPublish(expireMembershipJob),
    },
    pubsub3: {
        syncTrailMembersToMailchimp: functions.runWith({
            memory: "1GB",
            timeoutSeconds: 540
        }).pubsub.topic(PubSubTopic.sync_trial_members_to_mailchimp).onPublish(syncTrailToMailchimpMembersJob),
        googlePlayBillingEvents: functions.pubsub.topic(PubSubTopic.android_google_play_billing_events).onPublish(GooglePlayBillingJob),
        processCancellations: functions.pubsub.topic(PubSubTopic.process_cancellations).onPublish(CancellationJob),
        revenueCatEvents: functions.pubsub.topic(PubSubTopic.revenuecat_events).onPublish(RevenueCatEventJob),
    },

    //auth triggers
    authTriggers: {
        userCreatedTrigger: functions.auth.user().onCreate(user => transactionalOnCreate(user, false)),
        userDeletedTrigger: functions.auth.user().onDelete(onDelete),
    },

    //firestore triggers
    db1: {
        reflectionResponseWrite: onWriteReflectionResponse,
        updateMemberProfileTrigger: updateMemberProfileTrigger,
    },
    db2: {
        updatePromptSendTimeTrigger: updatePromptSendTimeTrigger,
        publishPromptContentTrigger: PromptContentTriggers.onContentPublished,
        updateSubscriptionDetailsTrigger,
        updateMemberCoreValueFromAssessment: updateMemberCoreValueFromAssessment,
    },
    db3: {
        gapAssessmentCompleted,
    }
};
