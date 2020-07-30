import * as express from "express";
import * as Sentry from "@sentry/node";
import Logger from "@shared/Logger"
import {
    MemberPromptNotificationTaskParams,
    SendEmailNotificationParams,
    SendPushNotificationParams
} from "@admin/tasks/PromptNotificationTypes";
import AdminPromptNotificationManager from "@admin/managers/AdminPromptNotificationManager";
import { stringifyJSON } from "@shared/util/ObjectUtil";
import HoboCache from "@admin/HoboCache";
import { SentryExpressHanderConfig } from "@api/util/RequestUtil";

const logger = new Logger("taskEndpoints");

const app = express();
app.use(Sentry.Handlers.requestHandler(SentryExpressHanderConfig) as express.RequestHandler);

app.post("/daily-prompt-email", async (req: express.Request, resp: express.Response) => {
    try {
        const taskId = req.header("x-cloudtasks-taskname");
        const retryCount = req.header("x-cloudtasks-taskretrycount");
        const executionCount = req.header("x-cloudtasks-taskexecutioncount");
        const params = req.body as SendEmailNotificationParams;
        logger.info("Send Emails task called", stringifyJSON(params, 2));

        const result = await AdminPromptNotificationManager.shared.sendPromptNotificationEmail(params);
        const logData = { taskInfo: { taskId, retryCount, executionCount }, params, result };
        logger.info(stringifyJSON(logData, 2));
        resp.sendStatus(204);
    } catch (error) {
        logger.error(error);
        resp.status(500).send({ message: "Unexpected error while processing email task", error });
        return
    }
})

app.post("/daily-prompt-push", async (req: express.Request, resp: express.Response) => {
    try {
        const taskId = req.header("x-cloudtasks-taskname");
        const retryCount = req.header("x-cloudtasks-taskretrycount");
        const executionCount = req.header("x-cloudtasks-taskexecutioncount");
        const params = req.body as SendPushNotificationParams;

        const pushResult = await AdminPromptNotificationManager.shared.sendPromptNotificationPush(params);
        const logData = { taskInfo: { taskId, retryCount, executionCount }, pushResult, params, };
        logger.info(stringifyJSON(logData));
        if (pushResult.retryable) {
            logger.info("The push task was not successful - will retry", pushResult.error);
            resp.status(500).send(pushResult.error);
        } else {
            resp.sendStatus(204);
        }
    } catch (error) {
        logger.error(error);
        resp.status(500).send({ message: "Unexpected error while processing push task", error });
        return
    }
})

app.post("/daily-prompt-setup", async (req: express.Request, resp: express.Response) => {
    try {
        logger.info("Create Daily Prompt Headers", stringifyJSON(req.headers, 2));
        const taskId = req.header("x-cloudtasks-taskname");
        const retryCount = req.header("x-cloudtasks-taskretrycount");
        const executionCount = req.header("x-cloudtasks-taskexecutioncount");
        const params: MemberPromptNotificationTaskParams = req.body;
        if (!params.memberId) {
            logger.info("No member ID was found, can not process task. Removing from queue");
            resp.status(200).send({
                success: false,
                error: "No member ID was found on the task. Can ont process it.",
                retryable: false
            });
        }

        const result = await AdminPromptNotificationManager.shared.createMemberDailyPromptNotifications(params);
        logger.info(stringifyJSON({
            params, result,
            taskInfo: {
                taskId, retryCount, executionCount
            }
        }, 2))

        if (result.success) {
            resp.status(200).send(result);
        } else if (result.retryable) {
            resp.status(500).send(result);
        } else {
            logger.error("Unable to process result and it is not retryable", JSON.stringify(result, null, 2));
            resp.status(200).send(result);
        }
    } catch (error) {
        logger.error(error);
        resp.status(500).send({ message: "Unexpected error while processing setup task", error });
    }
    return;
})

app.get("/purge-cache", async (req: express.Request, resp: express.Response) => {
    try {
        if (req.query.confirm !== "true") {
            resp.sendStatus(400);
            return
        }
        HoboCache.purge();
        resp.send(`Cache purged at ${ new Date().toISOString() } `);
        return;
    } catch (error) {
        logger.error("Unexpected error while processing API call", error);
        resp.status(500)
        resp.send({ error: error.message });
    }
});

app.use(Sentry.Handlers.errorHandler() as express.ErrorRequestHandler);
export default app;