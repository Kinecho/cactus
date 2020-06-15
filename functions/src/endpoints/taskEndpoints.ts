import * as express from "express";
import Logger from "@shared/Logger"
import { v2beta3 } from "@google-cloud/tasks";

const logger = new Logger("taskEndpoints");

const app = express();

const client = new v2beta3.CloudTasksClient();

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
    const baseUrl = "https://cactus-api.ngrok.io/cactus-app-stage/us-central1"
    const url = `${ baseUrl }/tasks/test`
    const queueName = "user-prompt-notifications"
    const projectId = "cactus-app-stage";
    const location = "us-central1";
    const payload = { email: "neil@cactus.appp" }
    const body = Buffer.from(JSON.stringify(payload)).toString("base64");

    const scheduledDate = new Date(Date.now() + 1000 * 10); //30 seconds in future

    const parent = client.queuePath(projectId, location, queueName);

    // const taskId = uuid()
    const taskId = "fixed-value"

    //Task names are used to de-duplicate tasks.
    //The task name must have the following format: projects/PROJECT_ID/locations/LOCATION_ID/queues/QUEUE_ID/tasks/TASK_ID
    const taskName = `projects/${ projectId }/locations/${ location }/queues/${ queueName }/tasks/${ taskId }`;

    const task = {
        name: taskName,
        httpRequest: {
            method: "POST",
            url,
            headers: {
                'Content-Type': 'application/json'
            },
            body,
        },
        scheduleTime: { seconds: scheduledDate.getTime() / 1000 } //time in seconds
    }


    try {
        const [response] = await client.createTask({ parent, task });
        logger.info(`Created task ${ response.name }`);
        resp.send({ success: true, response });
    } catch (error) {
        logger.error("Failed to send message", Error(error.message));
        logger.error(error);
        resp.status(400).send({ error })
    }

    return;
})


export default app;