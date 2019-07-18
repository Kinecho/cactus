import * as express from "express";
import * as cors from "cors";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {EmailStatusRequest, EmailStatusResponse} from "@shared/api/SignupEndpointTypes";
import AdminSlackService from "@shared/services/AdminSlackService";
import UserRecord = admin.auth.UserRecord;

const app = express();
app.use(cors({origin: true}));

app.post("/email-status", async (req: functions.https.Request | any, resp: functions.Response) => {

    const payload: EmailStatusRequest = req.body;

    const email = payload.email;
    let exists = false;
    let user: UserRecord | undefined | null = undefined;
    try {
        user = await admin.auth().getUserByEmail(email);
        if (user) {
            exists = true;
        }

    } catch (e) {
        console.error("no user found for email", email);
    }

    await AdminSlackService.getSharedInstance().sendActivityMessage({
        text: `${email} triggered the Magic Link flow. Existing Email = ${exists}`
    });

    const response: EmailStatusResponse = {exists, email};


    resp.send(response);
    return;
});


export default app;