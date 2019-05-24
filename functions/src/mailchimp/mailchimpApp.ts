// import * as functions from "firebase-functions"
import * as express from "express";
import * as cors from "cors";
import {sendActivityNotification} from "@api/slack/slack"

import SubscriptionRequest from "@shared/mailchimp/models/SubscriptionRequest";
import {signup} from "@api/mailchimp/mailchimpService";

const app = express();

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));

app.post("/", async (req: express.Request, res: express.Response ) => {
  console.log("request params", req.body);
  let subscription = SubscriptionRequest.fromData(req.body);
  res.contentType("application/json");

  let slackMessage = `${subscription.email} signed up!`;
  if (subscription.firstName || subscription.lastName){
    slackMessage = `${subscription.firstName} ${subscription.lastName}`.trim() + " " + `(${subscription.email}) signed up!`
  }
  if (subscription.referredByEmail){
    slackMessage += ` Referred by ${subscription.referredByEmail}`
  }

  try {
      const signupResult = await signup(subscription);
      console.log("singed up with result", signupResult);
      const slackResult = await sendActivityNotification(slackMessage);
      console.log("slack result", slackResult);
      console.log("new thing");

      return res.send({data: {success: true, message: `processed ${subscription.email}`, subscription}});

  } catch (error){
    return res.send({data: {success: false, message: `unable to process subscription for ${subscription.email}`, subscription, error}})
  }
});

export default app;

