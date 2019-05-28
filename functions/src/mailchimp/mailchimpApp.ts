// import * as functions from "firebase-functions"
import * as express from "express";
import * as cors from "cors";
import {sendActivityNotification} from "@api/slack/slack"

import SubscriptionRequest from "@shared/mailchimp/models/SubscriptionRequest";
import {signup} from "@api/mailchimp/mailchimpService";
import SubscriptionResult, {SubscriptionResultStatus} from "@shared/mailchimp/models/SubscriptionResult";
import ApiError from "@shared/ApiError";

const app = express();

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));

app.get("/", async (req: express.Request, res: express.Response) => {
    return res.send({success: true, message: "got the get request"})
});


app.get("/webhook", async (req: express.Request, res: express.Response) => {

    res.send({success: true})
});

app.post("/webhook", async (req: express.Request, res: express.Response) => {
    const data = req.body;
    console.log("webhook data", data);
    res.send({success: true})
});

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
          await sendActivityNotification(`An error occurred while signing up \`${subscription.email}\`. They were not added to mailchimp. \n\n \`\`\`${JSON.stringify(signupResult.error)}\`\`\``)
      }

      return res.send(signupResult);

  } catch (error){
      let result = new SubscriptionResult();
      result.success = false;
      let apiError = new ApiError();
      apiError.code = 500;
      apiError.friendlyMessage = "Unable to process your subscription. Please try again later";
      apiError.error = error;
      result.error = apiError;

      // result.member = null;
      result.status = SubscriptionResultStatus.unknown;


    return res.send(result)
  }
});

export default app;

