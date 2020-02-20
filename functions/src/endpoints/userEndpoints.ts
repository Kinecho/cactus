import * as express from "express";
import * as cors from "cors";
import {getConfig} from "@admin/config/configService";
import AdminUserService from "@admin/services/AdminUserService";
import {getAuthUser} from "@api/util/RequestUtil";
import {DeleteUserRequest} from "@shared/api/UserEndpointTypes";
import * as functions from "firebase-functions";
import Logger from "@shared/Logger";

const logger = new Logger("userEndpoints");
const app = express();
const config = getConfig();

// Automatically allow cross-origin requests
app.use(cors({origin: config.allowedOrigins}));

app.post("/delete-permanently", async (req: functions.https.Request | any, resp: functions.Response) => {
    const requestUser = await getAuthUser(req);
    
    if (!requestUser?.uid) {
        logger.log("No auth user was found on the request");
        resp.sendStatus(401);
        return
    }

    const payload = req.body;
    const {email} = payload as DeleteUserRequest;

    const user = await AdminUserService.getSharedInstance().getByEmail(email);

    if (!user?.email) {
        logger.log("User not found");
        resp.sendStatus(404);
        return
    }

    if (!user || user.id !== requestUser.uid) {
        logger.log("User not authorized");
        resp.sendStatus(403);
        return
    }

    logger.log('Permanently deleting user... ', user.id);
    const result = await AdminUserService.getSharedInstance().deleteAllDataPermanently({ email: user.email });
    logger.log('Delete results ', result);

    if (!result?.success) {
        logger.log("Error");
        resp.sendStatus(500);
        return
    }

    return;
});

export default app