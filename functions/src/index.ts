import * as functions from 'firebase-functions';
import mailchimpApp from "@api/endpoints/mailchimpApp";
import inboundApp from "@api/endpoints/inboundApp";
import checkoutApp from "@api/endpoints/checkoutApp";
import testApp from "@api/endpoints/testApp";
import * as EmailRecipientsJob from "@api/pubsub/subscribers/ProcessMailchimpCampaignRecipientsJob";
import {backupFirestore, exportFirestoreToBigQuery} from "@api/endpoints/DataExportJob";
import {onReflectionResponseCreated} from "@api/triggers/ReflectionResponseTriggers";
import {onCreate, onDelete} from "@api/endpoints/UserTriggers";
import {PubSubTopic} from "@shared/types/PubSubTypes";
import slackEndpoints from "@api/endpoints/slackEndpoints";
import signupEndpoints from "@api/endpoints/signupEndpoints";

export const cloudFunctions = {
    mailchimp: functions.https.onRequest(mailchimpApp),
    inbound: functions.https.onRequest(inboundApp),
    checkout: functions.https.onRequest(checkoutApp),
    test: functions.https.onRequest(testApp),
    slack: functions.https.onRequest(slackEndpoints),
    backupFirestore: functions.pubsub.topic(PubSubTopic.firestore_backup).onPublish(backupFirestore),
    exportToBigQuery: functions.pubsub.topic(PubSubTopic.firestore_export_bigquery).onPublish(exportFirestoreToBigQuery),
    processMailchimpEmailRecipients: functions.pubsub.topic(PubSubTopic.process_mailchimp_email_recipients).onPublish(EmailRecipientsJob.onPublish),
    userCreatedTrigger: functions.auth.user().onCreate(onCreate),
    userDeletedTrigger: functions.auth.user().onDelete(onDelete),
    reflectionResponseCreatedTrigger: onReflectionResponseCreated,
    signup: functions.https.onRequest(signupEndpoints),
};
