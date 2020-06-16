import * as express from "express";
import Logger from "@shared/Logger"
import chalk from "chalk";
import CloudTaskService, { SubmitTaskResponse, TaskQueueConfigName } from "@admin/services/CloudTaskService";
import { getRandomNumberBetween } from "@shared/util/StringUtil";
import { stringifyJSON } from "@shared/util/ObjectUtil";

const logger = new Logger("taskEndpoints");

const app = express();

app.post("/send-prompt-notifications", async (req: express.Request, resp: express.Response) => {
    const randomNumber = getRandomNumberBetween(0, 10);
    if (randomNumber === 5) {
        logger.error(chalk.red("Forcing a failure"));
        resp.sendStatus(500);
        return;
    }
    logger.info("Notification payload", stringifyJSON(req.body));
    resp.sendStatus(200);
    return;
})

app.post("/test", async (req: express.Request, resp: express.Response) => {
    logger.info("Got the task request", req.body);

    // resp.send("OK, got it");
    return new Promise(resolve => {
        setTimeout(() => {
            resp.sendStatus(200);
            resolve();
        }, 5000)
    })
})

app.get("/create", async (req: express.Request, resp: express.Response) => {
    // const baseUrl = "https://cactus-api.ngrok.io/cactus-app-stage/us-central1"
    const payload = { email: "neil@cactus.appp" }
    // const body = Buffer.from(JSON.stringify(payload)).toString("base64");
    const numToCreate = Number(req.query.num ?? "1");
    const numSeconds = Number(req.query.s ?? "10");
    const scheduledDate = new Date(Date.now() + 1000 * numSeconds);

    try {
        const responses: SubmitTaskResponse[] = [];
        for (let i = 0; i < numToCreate; i++) {
            const response = await CloudTaskService.shared.submitHttpTask({
                queue: TaskQueueConfigName.user_prompt_notifications,
                payload,
                processAt: scheduledDate,
            });

            logger.info(`[task_${ i + 1 }] Created task ${ response.task?.name }`);
            responses.push(response);
        }
        // const [response] = await client.createTask({ parent, task });

        resp.send(responses);
    } catch (error) {
        logger.error("Failed to send message", Error(error.message));
        logger.error(error);
        resp.status(400).send({ error })
    }

    return;
})


export default app;