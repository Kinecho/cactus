require("module-alias/register");
import * as functions from 'firebase-functions';
import mailchimpApp from "@api/mailchimp/mailchimpApp";
import inboundApp from "@api/inbound/inboundApp";

/**
 * Handle mailchimp related things. This is a full express app/routing tier
 */
export const mailchimp = functions.https.onRequest(mailchimpApp);

/**
 * Handle inbound emails
 */
export const inbound  = functions.https.onRequest(inboundApp);