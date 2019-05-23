// import * as functions from "firebase-functions"
import * as express from "express";
import * as cors from "cors";
import {sendActivityNotification} from "@cactus/slack/slack"
import SubscriptionRequest from "@cactus/mailchimp/models/SubscriptionRequest";

const app = express();

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));

app.post("/", (req: express.Request, res: express.Response ) => {
  console.log("request params", req.body);
  let subscription = SubscriptionRequest.fromRequest(req);
  res.contentType("application/json");

  let slackMessage = `${subscription.email} signed up!`;
  if (subscription.firstName || subscription.lastName){
    slackMessage = `${subscription.firstName} ${subscription.lastName}`.trim() + " " + `(${subscription.email}) signed up!`
  }
  if (subscription.referredByEmail){
    slackMessage += ` Referred by ${subscription.referredByEmail}`
  }

  return sendActivityNotification(slackMessage).then(result => {
    return res.send({data: {success: true, message: `processed ${subscription.email}`, subscription}});
  }).catch(error => {
    return res.send({data: {success: false, message: `unable to process subscription for ${subscription.email}`, subscription, error}})
  })
});

export default app;

