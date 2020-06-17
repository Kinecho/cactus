import * as express from "express";
import Logger from "@shared/Logger"
import { SubmitTaskResponse } from "@admin/services/CloudTaskService";
import { MemberPromptNotificationTaskParams } from "@admin/tasks/PromptNotificationTypes";
import PromptNotificationManager from "@admin/managers/PromptNotificationManager";
import { PromptSendTime } from "@shared/models/CactusMember";
import { getQuarterHourFromMinute } from "@shared/util/DateUtil";
import { DateTime } from "luxon";
import { stringifyJSON } from "@shared/util/ObjectUtil";

const logger = new Logger("taskEndpoints");

const app = express();

app.post("/send-emails", async (req: express.Request, resp: express.Response) => {
    logger.info("Send Emails task called", stringifyJSON(req.body));
    resp.sendStatus(204);
    return;
})

app.post("/send-push-notifications", async (req: express.Request, resp: express.Response) => {
    logger.info("Send Push Notifications task called", stringifyJSON(req.body));
    resp.sendStatus(204);
    return;
})

app.post("/send-prompt-notifications", async (req: express.Request, resp: express.Response) => {
    const params: MemberPromptNotificationTaskParams = req.body;
    if (!params.memberId) {
        logger.info("No member ID was found, can not process task. Removing from queue");
        resp.status(200).send({
            success: false,
            error: "No m ember ID was found on the task. Can ont process it.",
            retryable: false
        });
    }

    const result = await PromptNotificationManager.shared.processMemberPromptNotification(params);

    await PromptNotificationManager.shared.notifySlackResults(params, result);

    if (result.success) {
        resp.status(200).send(result);
    } else if (result.retryable) {
        resp.status(500).send(result);
    } else {
        logger.error("Unable to process result and it is not retryable", JSON.stringify(result, null, 2));
        resp.status(200).send(result);
    }
    return;
})

app.get("/create", async (req: express.Request, resp: express.Response) => {
    const numToCreate = Number(req.query.num ?? "1");
    const numSeconds = Number(req.query.s ?? "10");
    const processAt = new Date(Date.now() + 1000 * numSeconds);
    const today = new Date();
    const utcHour = today.getUTCHours()
    const utcMinutes = getQuarterHourFromMinute(today.getUTCMinutes());

    const memberId = "s4RMQ186oVFvNbJan41b" //neil@cactus.app
    const promptSendTimeUTC: PromptSendTime = { hour: utcHour, minute: utcMinutes };

    try {
        const tasks: Promise<SubmitTaskResponse>[] = [];
        for (let i = 0; i < numToCreate; i++) {
            const createTask = PromptNotificationManager.shared.createMemberNotificationTask({
                memberId,
                promptSendTimeUTC,
                systemDateObject: DateTime.utc().toObject()
            }, processAt)
            tasks.push(createTask);
        }
        const responses = await Promise.all(tasks);
        resp.send(responses);
    } catch (error) {
        logger.error("Failed to send message", Error(error.message));
        logger.error(error);
        resp.status(400).send({ error })
    }

    return;
})


export default app;