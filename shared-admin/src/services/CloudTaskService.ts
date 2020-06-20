import { CactusConfig, TaskQueueConfig } from "@shared/CactusConfig";
import Logger from "@shared/Logger"
import { v2beta3 } from "@google-cloud/tasks";
import { google } from "@google-cloud/tasks/build/protos/protos";

import ICreateTaskRequest = google.cloud.tasks.v2beta3.ICreateTaskRequest;
import ITask = google.cloud.tasks.v2beta3.ITask;
import { stringifyJSON } from "@shared/util/ObjectUtil";

const logger = new Logger("CloudTaskService");

export interface SubmitTaskResponse {
    task?: ITask,
    success: boolean,
    error?: any,
    alreadyExists?: boolean,
    skipped?: boolean,
    message?: string,
}

export enum TaskQueueConfigName {
    user_prompt_notifications = "user_prompt_notifications",
    send_push_notifications = "send_push_notifications",
    send_emails = "send_emails",
}

export default class CloudTaskService {
    protected static _shared: CloudTaskService;

    static get shared(): CloudTaskService {
        if (CloudTaskService._shared) {
            return CloudTaskService._shared;
        }
        throw new Error("CloudTaskService not initialized. You must initialize the service before requesting it.");
    }

    static initialize(config: CactusConfig) {
        CloudTaskService._shared = new CloudTaskService(config);
    }

    config: CactusConfig;
    client: v2beta3.CloudTasksClient;

    constructor(config: CactusConfig) {
        this.config = config;
        this.client = new v2beta3.CloudTasksClient();
        logger.info("Set up the cloud tasks client");
    }

    get queueLocation(): string {
        return this.config.tasks.location;
    }

    get queueProjectId(): string {
        return this.config.tasks.project_id;
    }

    get handlerBaseUrl(): string {
        return this.config.tasks.handler_url_base;
    }

    getQueueConfig(queue: TaskQueueConfigName): TaskQueueConfig {
        return this.config.tasks.queues[queue];
    }

    buildTaskName(options: { queue: TaskQueueConfigName, taskId: string }): string {
        const { queue, taskId } = options;
        const config = this.getQueueConfig(queue);
        return `projects/${ this.queueProjectId }/locations/${ this.queueLocation }/queues/${ config.name }/tasks/${ taskId }`;
    }

    buildHandlerUrl(options: { queue: TaskQueueConfigName }): string {
        const config = this.getQueueConfig(options.queue);
        return `${ this.handlerBaseUrl }${ config.handler_path }`;
    }

    buildParent(queue: TaskQueueConfigName): string {
        const config = this.getQueueConfig(queue);
        return this.client.queuePath(this.queueProjectId, this.queueLocation, config.name);
    }

    encodeBody(body: any): string {
        return Buffer.from(stringifyJSON(body)).toString("base64");
    }

    async submitHttpTask(params: { taskId?: string, queue: TaskQueueConfigName, payload: any, processAt?: Date }): Promise<SubmitTaskResponse> {
        try {
            const { taskId, queue, payload, processAt } = params;
            const queueConfig = this.getQueueConfig(queue);
            const body = this.encodeBody(payload);
            const parent = this.buildParent(queue);

            let name: string | undefined;
            if (taskId) {
                name = this.buildTaskName({ queue, taskId });
            }

            let scheduleTime: { seconds: number } | null = null;
            if (processAt) {
                scheduleTime = { seconds: processAt.getTime() / 1000 }
            }

            const taskRequest: ICreateTaskRequest = {
                parent,
                task: {
                    name,
                    scheduleTime,
                    httpRequest: {
                        url: this.buildHandlerUrl({ queue }),
                        httpMethod: queueConfig.http_method,
                        body,
                        headers: {
                            'Content-Type': 'application/json'
                        },
                    }
                }
            }

            logger.info(`Submitting http task to ${ queue }`, stringifyJSON(payload, 2));
            const [createdTask] = await this.client.createTask(taskRequest);
            return {
                task: createdTask,
                success: true,
            };
        } catch (error) {
            logger.error(`Failed to submit http task: ${ JSON.stringify(params) }`, error);
            if (error.code === 6) { //task already exists
                return { success: true, error, alreadyExists: true };
            }
            return { success: false, error };
        }

    }
}