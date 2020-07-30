import { getAdmin, getCactusConfig, Project } from "@scripts/config";
import * as admin from "firebase-admin";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as chalk from "chalk";
import { resetConsole } from "@scripts/util/ConsoleUtil";
import { CactusConfig } from "@admin/CactusConfig";
import { initializeServices } from "@admin/services/AdminServiceConfig";
import { setTimestamp } from "@shared/util/FirestoreUtil";
import { setConfig } from "@admin/config/configService";
import { stringifyJSON } from "@shared/util/ObjectUtil";
import Logger from "@shared/Logger"

const logger = new Logger("CommandTypes");
const prompts = require("prompts");

export interface Command {
    name: string;
    description?: string;
    showInList: boolean;
    start: () => Promise<void>,
}

export interface FirebaseCommandConstructorArgs {
    useAdmin: boolean;
    name?: string;
}

export interface ProjectInput {
    project: Project,
}

export abstract class FirebaseCommand implements Command {
    project?: Project; //default project to stage
    app!: admin.app.App;
    useAdmin: boolean;
    abstract name: string;
    description?: string;
    abstract showInList: boolean;
    confirmExecution: boolean = false;
    firestoreService?: AdminFirestoreService;
    config!: CactusConfig;

    protected abstract async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void>;

    async start(): Promise<void> {
        if (this.description) {
            console.log(`\n${ this.description }\n`)
        }

        if (this.confirmExecution) {
            const { confirmed } = await prompts([{
                type: "confirm",
                message: "Do you want to run this command?",
                name: "confirmed"
            }]);

            if (!confirmed) {
                console.log(`\n${ chalk.red("Not running command") }`);
                return;
            }
        }

        const app = await this.getFirebaseApp();

        const project = this.project || Project.STAGE;
        console.log("Fetching config for ", project);
        const config = await getCactusConfig(project);
        this.config = config;


        // const firestoreService = await this.getFirestoreService();
        console.log("initializing all services");
        setTimestamp(admin.firestore.Timestamp);
        setConfig(config);
        initializeServices(config, app, admin.firestore.Timestamp);
        this.firestoreService = AdminFirestoreService.getSharedInstance();
        console.group(chalk.yellow(`${ this.name } Logs:`));

        await this.run(app, this.firestoreService, config);
        console.groupEnd();
        process.exit(0);
    }

    protected constructor(opts: FirebaseCommandConstructorArgs = { useAdmin: false, name: "Command" }) {
        this.useAdmin = opts.useAdmin;
    }

    async getFirestoreService(): Promise<AdminFirestoreService> {
        if (this.firestoreService) {
            return this.firestoreService;
        }

        const app = await this.getFirebaseApp();
        AdminFirestoreService.initialize(app, this.config);
        AdminFirestoreService.Timestamp = admin.firestore.Timestamp;
        this.firestoreService = AdminFirestoreService.getSharedInstance();
        return this.firestoreService;
    }

    async getFirebaseApp(): Promise<admin.app.App> {
        if (this.app) {
            return this.app;
        }

        if (!this.project) {
            const questions = [
                {
                    type: "select",
                    name: 'project',
                    message: 'Choose environment',
                    choices: [{ title: "Cactus Stage", value: Project.STAGE }, {
                        title: "Cactus Prod",
                        value: Project.PROD
                    }],
                    limit: 20,
                },
            ];
            const response: ProjectInput = await prompts(questions, {
                onCancel: () => {
                    console.log("Canceled command");
                    return process.exit(0);
                }
            });

            this.project = response.project;
        }

        this.app = await getAdmin(this.project, { useAdmin: this.useAdmin });

        if (!this.app) {
            console.error("Failed to get the firebase app");
            process.exit(1);
        }
        logger.info(`Got app with admin=${ this.useAdmin }: ${ stringifyJSON(this.app.options) }`)
        resetConsole();
        //@ts-ignore
        const projectId = this.app.options.projectId ?? this.app.options.sdkConfig.projectId;
        const separator = "====================================================";
        const message = `${ separator }\n Starting ${ this.name }\n Using firebase project ${ chalk.blue(projectId || "unknown") }\n${ separator }`;
        console.log(chalk.bold.green(message));

        return this.app;
    }
}