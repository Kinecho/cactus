require("module-alias/register");
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin'
import {setTimestamp} from "@shared/util/FirebaseUtil";
import mailchimpApp from "@api/mailchimp/mailchimpApp";
import inboundApp from "@api/inbound/inboundApp";

admin.initializeApp();
setTimestamp(admin.firestore.Timestamp);

/**
 * Handle mailchimp related things. This is a full express app/routing tier
 */
export const mailchimp = functions.https.onRequest(mailchimpApp);

/**
 * Handle inbound emails
 */
export const inbound = functions.https.onRequest(inboundApp);