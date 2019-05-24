require("module-alias/register");
import * as functions from 'firebase-functions';
import mailchimpHandler from "@api/mailchimp/mailchimp";
// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
export const mailchimp = functions.https.onRequest(mailchimpHandler);