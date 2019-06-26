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

/**
 * Imports of the various endpoints needs to be after the initial setup steps above.
 */

import mailchimpApp from "@api/endpoints/mailchimpApp";
import inboundApp from "@api/endpoints/inboundApp";
import checkoutApp from "@api/endpoints/checkoutApp";


export const mailchimp = functions.https.onRequest(mailchimpApp);
export const inbound = functions.https.onRequest(inboundApp);
export const checkout = functions.https.onRequest(checkoutApp);