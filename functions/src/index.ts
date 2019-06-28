require("module-alias/register");
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin'
import {getConfig} from "@api/config/configService";
import MailchimpService from "@shared/services/MailchimpService";
import AdminFirestoreService from "@shared/services/AdminFirestoreService";
import AdminCactusMemberService from "@shared/services/AdminCactusMemberService";
//need to initialize these modules before including any other code
admin.initializeApp();
const app = admin.app();
const config = getConfig();


AdminFirestoreService.initialize(app);
MailchimpService.initialize(config.mailchimp.api_key, config.mailchimp.audience_id);
AdminCactusMemberService.initialize();

import {setTimestamp} from "@shared/util/FirebaseUtil";
setTimestamp(admin.firestore.Timestamp);

/**
 * Imports of the various endpoints needs to be after the initial setup steps above.
 */

import mailchimpApp from "@api/endpoints/mailchimpApp";
import inboundApp from "@api/endpoints/inboundApp";
import checkoutApp from "@api/endpoints/checkoutApp";
import testApp from "@api/endpoints/testApp";


export const mailchimp = functions.https.onRequest(mailchimpApp);
export const inbound = functions.https.onRequest(inboundApp);
export const checkout = functions.https.onRequest(checkoutApp);
export const test = functions.https.onRequest(testApp);