// import * as functions from "firebase-functions"
import * as express from "express";
import * as cors from "cors";
import {sendActivityNotification} from "@api/slack/slack"

import SubscriptionRequest from "@shared/mailchimp/models/SubscriptionRequest";
import {signup} from "@api/mailchimp/mailchimpService";
import {SubscriptionResultStatus} from "@shared/mailchimp/models/SubscriptionResult";

const app = express();

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));

app.post("/", async (req: express.Request, res: express.Response ) => {
  console.log("request params", req.body);
  const subscription = SubscriptionRequest.fromData(req.body);
  res.contentType("application/json");

  try {
      const signupResult = await signup(subscription);
      console.log("singed up with result", signupResult);

      if (signupResult.status === SubscriptionResultStatus.new_subscriber){
          console.log("new user signed up successfully");


          let slackMessage = `${subscription.email} signed up!`;
          if (subscription.firstName || subscription.lastName){
              slackMessage = `${subscription.firstName} ${subscription.lastName}`.trim() + " " + `(${subscription.email}) signed up!`
          }
          if (subscription.referredByEmail){
              slackMessage += ` Referred by ${subscription.referredByEmail}`
          }

          const slackResult = await sendActivityNotification(slackMessage);
          console.log("slack result", slackResult);
      } else if (!signupResult.success){
          await sendActivityNotification(`An error occurred while signing up ${subscription.email}. They were not added to mailchimp. \n\n \`\`\`${JSON.stringify(signupResult.error)}\`\`\``)
      }

      return res.send({data: signupResult});

  } catch (error){
    return res.send({data: {success: false, message: `unable to process subscription for ${subscription.email}`, subscription, error}})
  }
});

export default app;

