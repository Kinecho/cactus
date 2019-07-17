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

export const mailchimp = functions.https.onRequest(mailchimpApp);
export const inbound = functions.https.onRequest(inboundApp);
export const checkout = functions.https.onRequest(checkoutApp);
export const test = functions.https.onRequest(testApp);
export const userCreatedTrigger = functions.auth.user().onCreate(onCreate);
export const userDeletedTrigger = functions.auth.user().onDelete(onDelete);

export const cloudFunctions = {
    mailchimp,
    inbound,
    checkout,
    test,
    slack: functions.https.onRequest(slackEndpoints),
    backupFirestore: functions.pubsub.topic(PubSubTopic.firestore_backup).onPublish(backupFirestore),
    exportToBigQuery: functions.pubsub.topic(PubSubTopic.firestore_export_bigquery).onPublish(exportFirestoreToBigQuery),
    processMailchimpEmailRecipients: functions.pubsub.topic(PubSubTopic.process_mailchimp_email_recipients).onPublish(EmailRecipientsJob.onPublish),
    userCreatedTrigger,
    userDeletedTrigger,
    reflectionResponseCreatedTrigger: onReflectionResponseCreated,
};
