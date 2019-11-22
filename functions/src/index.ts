import * as functions from 'firebase-functions';
import mailchimpApp from "@api/endpoints/mailchimpEndpoints";
import inboundApp from "@api/endpoints/inboundApp";
import checkoutApp from "@api/endpoints/checkoutApp";
import testApp from "@api/endpoints/testApp";
import * as EmailRecipientsJob from "@api/pubsub/subscribers/ProcessMailchimpCampaignRecipientsJob";
import {backupFirestore, exportFirestoreToBigQuery} from "@api/endpoints/DataExportJob";
import * as BridgeToMondayJob from "@api/pubsub/subscribers/BridgeToMondayJob";
import * as UnsubscriberReportSyncJob from "@api/pubsub/subscribers/UnsubscriberReportSyncJob";
import {
    onReflectionResponseCreated,
    updateReflectionStatsTrigger,
    updateSentPromptOnReflectionWrite
} from "@api/triggers/ReflectionResponseTriggers";
import * as SlackCommandJob from "@api/pubsub/subscribers/SlackCommandJob";
import * as DailySentPromptJob from "@api/pubsub/subscribers/DailySentPromptJob";

import * as SentPromptTriggers from "@api/triggers/SentPromptTriggers";
import {onDelete, transactionalOnCreate} from "@api/triggers/UserTriggers";
import {PubSubTopic} from "@shared/types/PubSubTypes";
import slackEndpoints from "@api/endpoints/slackEndpoints";
import signupEndpoints from "@api/endpoints/signupEndpoints";
import flamelinkEndpoints from "@api/endpoints/flamelinkEndpoints";
import {updateMemberProfileTrigger} from "@api/triggers/MemberTriggers";

export const cloudFunctions = {
    //API Endpoints
    checkout: functions.https.onRequest(checkoutApp),
    flamelink: functions.https.onRequest(flamelinkEndpoints),
    inbound: functions.https.onRequest(inboundApp),
    mailchimp: functions.https.onRequest(mailchimpApp),
    slack: functions.https.onRequest(slackEndpoints),
    signup: functions.https.onRequest(signupEndpoints),
    test: functions.https.onRequest(testApp),

    //PubSub topics
    bridgeToMondayJob: functions.pubsub.topic(PubSubTopic.bridge_to_monday_prune).onPublish(BridgeToMondayJob.onPublish),
    dailySentPromptJob: functions.pubsub.topic(PubSubTopic.create_daily_sent_prompts).onPublish(DailySentPromptJob.onPublish),
    backupFirestore: functions.pubsub.topic(PubSubTopic.firestore_backup).onPublish(backupFirestore),
    exportToBigQuery: functions.pubsub.topic(PubSubTopic.firestore_export_bigquery).onPublish(exportFirestoreToBigQuery),
    processMailchimpEmailRecipients: functions.pubsub.topic(PubSubTopic.process_mailchimp_email_recipients).onPublish(EmailRecipientsJob.onPublish),
    slackCommandJob: functions.pubsub.topic(PubSubTopic.slack_command).onPublish(SlackCommandJob.onPublish),
    unsubscriberSyncJob: functions.pubsub.topic(PubSubTopic.unsubscriber_sync).onPublish(UnsubscriberReportSyncJob.onPublish),

    //auth triggers
    // userCreatedTrigger: functions.auth.user().onCreate(onCreate),
    userCreatedTrigger: functions.auth.user().onCreate(transactionalOnCreate),
    userDeletedTrigger: functions.auth.user().onDelete(onDelete),

    //firestore triggers
    reflectionResponseCreatedTrigger: onReflectionResponseCreated,
    sentPromptPushNotificationTrigger: SentPromptTriggers.sentPromptPushNotificationTrigger,
    updateReflectionStatsTrigger: updateReflectionStatsTrigger,
    updateMemberProfileTrigger: updateMemberProfileTrigger,
    updateSentPromptOnReflectionWrite: updateSentPromptOnReflectionWrite,
};
