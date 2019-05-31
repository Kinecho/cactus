// import * as functions from "firebase-functions"
import * as express from "express";
import * as cors from "cors";
import {sendActivityNotification, SlackMessage} from "@api/slack/slack"

import SubscriptionRequest from "@shared/mailchimp/models/SubscriptionRequest";
import {signup} from "@api/mailchimp/mailchimpService";
import SubscriptionResult, {SubscriptionResultStatus} from "@shared/mailchimp/models/SubscriptionResult";
import ApiError from "@shared/ApiError";
import {writeToFile} from "@api/util/FileUtil";

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
    const date = new Date();
    const dateId = date.getTime();
    await writeToFile(`output/webhook/${dateId}-mailchimp.json`, data);
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



          // if (subscription.referredByEmail){
          //     slackMessage += ` Referred by ${subscription.referredByEmail}`
          // }

          const fields = [
              {
                  title: "Email",
                  value: subscription.email,
                  short: true
              }
          ];

          if (subscription.firstName || subscription.lastName) {
              fields.push({
                  title: "Name",
                  value: `${subscription.firstName} ${subscription.lastName}`.trim(),
                  short: true
              });
          }

          if (subscription.referredByEmail){
              fields.push({
                  title: "Referred By",
                  value: subscription.referredByEmail,
                  short: true,
              })
          }

          const attachmentSummary = {
              color: "#33CCAB",
              fields: fields
          };

          const message:SlackMessage = {
              text: "Got a new signup!",
              attachments: [attachmentSummary],
          };

          const slackResult = await sendActivityNotification(message);
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

