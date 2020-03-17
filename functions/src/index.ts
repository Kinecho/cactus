import * as functions from 'firebase-functions';
import mailchimpApp from "@api/endpoints/mailchimpEndpoints";
import inboundApp from "@api/endpoints/inboundApp";
import checkoutApp from "@api/endpoints/checkoutApp";
import manageNotificationApp from "@api/endpoints/manageNotificationsEndpoints";
import testApp from "@api/endpoints/testApp";
import * as EmailRecipientsJob from "@api/pubsub/subscribers/ProcessMailchimpCampaignRecipientsJob";
import {backupFirestore, exportFirestoreToBigQuery} from "@api/endpoints/DataExportJob";
import * as BridgeToMondayJob from "@api/pubsub/subscribers/BridgeToMondayJob";
import * as UnsubscriberReportSyncJob from "@api/pubsub/subscribers/UnsubscriberReportSyncJob";
import {
    onReflectionResponseCreated,
    updateReflectionStatsTrigger,
    updateSentPromptOnReflectionWrite,
    updateInsightWordsOnReflectionWrite
} from "@api/triggers/ReflectionResponseTriggers";
import * as SlackCommandJob from "@api/pubsub/subscribers/SlackCommandJob";
import * as DailySentPromptJob from "@api/pubsub/subscribers/DailySentPromptJob";
import * as MemberStatsJob from "@api/pubsub/subscribers/MemberStatsJob";
import * as CustomSentPromptNotificationsJob from "@api/pubsub/subscribers/CustomSentPromptNotificationsJob";
import * as SentPromptTriggers from "@api/triggers/SentPromptTriggers";
import {onDelete} from "@api/triggers/UserTriggers";
import {PubSubTopic} from "@shared/types/PubSubTypes";
import slackEndpoints from "@api/endpoints/slackEndpoints";
import signupEndpoints from "@api/endpoints/signupEndpoints";
import flamelinkEndpoints from "@api/endpoints/flamelinkEndpoints";
import socialEndpoints from "@api/endpoints/socialEndpoints";
import userEndpoints from "@api/endpoints/userEndpoints";
import appleEndpoints from "@api/endpoints/appleEndpoints"
import {
    updateMemberProfileTrigger,
    updatePromptSendTimeTrigger,
    updateSubscriptionDetailsTrigger
} from "@api/triggers/MemberTriggers";
import * as PromptContentTriggers from "@api/triggers/PromptContentTriggers";
import {onPublish as expireMembershipJob} from "@api/pubsub/subscribers/ExpireMembershipTrialJob";
import {onPublish as syncTrailToMailchimpMembersJob} from "@admin/pubsub/SyncTrialMembersToMailchimpJob";
import {onPublish as GooglePlayBillingJob} from "@api/pubsub/subscribers/GooglePlayBillingListeners";
import {transactionalOnCreate} from "@admin/AuthUserCreateJob";

export const cloudFunctions = {
    //API Endpoints
    checkout: functions.https.onRequest(checkoutApp),
    flamelink: functions.https.onRequest(flamelinkEndpoints),
    inbound: functions.https.onRequest(inboundApp),
    mailchimp: functions.https.onRequest(mailchimpApp),
    slack: functions.https.onRequest(slackEndpoints),
    signup: functions.https.onRequest(signupEndpoints),
    social: functions.https.onRequest(socialEndpoints),
    user: functions.https.onRequest(userEndpoints),
    test: functions.https.onRequest(testApp),
    notificationPreferences: functions.https.onRequest(manageNotificationApp),
    apple: functions.https.onRequest(appleEndpoints),

    //PubSub topics
    bridgeToMondayJob: functions.pubsub.topic(PubSubTopic.bridge_to_monday_prune).onPublish(BridgeToMondayJob.onPublish),
    dailySentPromptJob: functions.pubsub.topic(PubSubTopic.create_daily_sent_prompts).onPublish(DailySentPromptJob.onPublish),
    backupFirestore: functions.pubsub.topic(PubSubTopic.firestore_backup).onPublish(backupFirestore),
    exportToBigQuery: functions.pubsub.topic(PubSubTopic.firestore_export_bigquery).onPublish(exportFirestoreToBigQuery),
    processMailchimpEmailRecipients: functions.pubsub.topic(PubSubTopic.process_mailchimp_email_recipients).onPublish(EmailRecipientsJob.onPublish),
    slackCommandJob: functions.pubsub.topic(PubSubTopic.slack_command).onPublish(SlackCommandJob.onPublish),
    unsubscriberSyncJob: functions.pubsub.topic(PubSubTopic.unsubscriber_sync).onPublish(UnsubscriberReportSyncJob.onPublish),
    memberStatsJob: functions.pubsub.topic(PubSubTopic.member_stats_sync).onPublish(MemberStatsJob.onPublish),
    customSentPromptNotifications: functions.pubsub.topic(PubSubTopic.custom_sent_prompt_notifications).onPublish(CustomSentPromptNotificationsJob.onPublish),
    expireTrials: functions.pubsub.topic(PubSubTopic.expire_subscription_trials).onPublish(expireMembershipJob),
    syncTrailMembersToMailchimp: functions.pubsub.topic(PubSubTopic.sync_trial_members_to_mailchimp).onPublish(syncTrailToMailchimpMembersJob),
    googlePlayBillingEvents: functions.pubsub.topic(PubSubTopic.google_play_billing_events).onPublish(GooglePlayBillingJob),

    //auth triggers
    userCreatedTrigger: functions.auth.user().onCreate(user => transactionalOnCreate(user, false)),
    userDeletedTrigger: functions.auth.user().onDelete(onDelete),

    //firestore triggers
    reflectionResponseCreatedTrigger: onReflectionResponseCreated,
    sentPromptPushNotificationTrigger: SentPromptTriggers.sentPromptPushNotificationTrigger,
    updateReflectionStatsTrigger: updateReflectionStatsTrigger,
    updateMemberProfileTrigger: updateMemberProfileTrigger,
    updateSentPromptOnReflectionWrite: updateSentPromptOnReflectionWrite,
    updatePromptSendTimeTrigger: updatePromptSendTimeTrigger,
    publishPromptContentTrigger: PromptContentTriggers.onContentPublished,
    updateSubscriptionDetailsTrigger,
    updateInsightWordsOnReflectionWrite: updateInsightWordsOnReflectionWrite
};
