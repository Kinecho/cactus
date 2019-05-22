import * as functions from 'firebase-functions';
import mailchimpHandler from "./mailchimp/mailchimp";
// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
export const mailchimp = functions.https.onRequest(mailchimpHandler);
