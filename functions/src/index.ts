import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin'
import {getConfig, PubSubTopic} from "@api/config/configService";
import MailchimpService from "@shared/services/MailchimpService";
import AdminFirestoreService from "@shared/services/AdminFirestoreService";
import AdminCactusMemberService from "@shared/services/AdminCactusMemberService";
import AdminUserService from "@shared/services/AdminUserService";
import AdminSentPromptService from "@shared/services/AdminSentPromptService";
import AdminReflectionPromptService from "@shared/services/AdminReflectionPromptService";

//need to initialize these modules before including any other code
admin.initializeApp();
const app = admin.app();
const config = getConfig();


AdminFirestoreService.initialize(app);
MailchimpService.initialize(config.mailchimp.api_key, config.mailchimp.audience_id);
AdminCactusMemberService.initialize();
AdminUserService.initialize(config);
AdminReflectionPromptService.initialize();
AdminSentPromptService.initialize();

import {setTimestamp} from "@shared/util/FirestoreUtil";

setTimestamp(admin.firestore.Timestamp);

/**
 * Imports of the various endpoints needs to be after the initial setup steps above.
 */

import mailchimpApp from "@api/endpoints/mailchimpApp";
import inboundApp from "@api/endpoints/inboundApp";
import checkoutApp from "@api/endpoints/checkoutApp";
import testApp from "@api/endpoints/testApp";
import {backupFirestore, exportFirestoreToBigQuery} from "@api/endpoints/DataExportJob";

import {onCreate, onDelete} from "@api/endpoints/UserTriggers";

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
    backupFirestore: functions.pubsub.topic(PubSubTopic.firestore_backup).onPublish(backupFirestore),
    exportToBigQuery: functions.pubsub.topic(PubSubTopic.firestore_export_bigquery).onPublish(exportFirestoreToBigQuery),
    userCreatedTrigger,
    userDeletedTrigger,
};
