require("module-alias/register");
import * as functions from 'firebase-functions';
import mailchimpApp from "@api/mailchimp/mailchimpApp";
// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
export const mailchimp = functions.https.onRequest(mailchimpApp);