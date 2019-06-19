require("module-alias/register");
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin'
import AdminFirestoreService from "@shared/services/AdminFirestoreService";
//need to initialize these modules before including any other code
admin.initializeApp();
const app = admin.app();
AdminFirestoreService.initialize(app);

import {setTimestamp} from "@shared/util/FirebaseUtil";
setTimestamp(admin.firestore.Timestamp);

import mailchimpApp from "@api/mailchimp/mailchimpApp";
import inboundApp from "@api/inbound/inboundApp";

/**
 * Handle mailchimp related things. This is a full express app/routing tier
 */
export const mailchimp = functions.https.onRequest(mailchimpApp);

/**
 * Handle inbound emails
 */
export const inbound = functions.https.onRequest(inboundApp);