import {FirebaseCommand} from "@scripts/run";
import {Campaign} from "@shared/mailchimp/models/MailchimpTypes";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import {Project} from "@scripts/config";
import * as admin from "firebase-admin";
import AdminFirestoreService from "@shared/services/AdminFirestoreService";
import chalk from "chalk";

export default class SaveQuestionCommand extends FirebaseCommand {
    question?:string;
    campaign?: Campaign;
    reminderCampaign?: Campaign;
    model?: ReflectionPrompt;
    contentPath?: string;

    constructor(project: Project|undefined=undefined){
        super({name: "Save Question Command", useAdmin: true});
        this.project = project;
        // this.model = new ReflectionPrompt()
    }

    async getModel():Promise<ReflectionPrompt>{
        if (this.model){
            return this.model;
        }

        const model = new ReflectionPrompt();
        const firestoreService = await this.getFirestoreService();
        this.model = firestoreService.initializeModel(model);
        return this.model;
    }

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService): Promise<void> {
        console.log(chalk.bgYellow.black("Starting save question command..."));

        const model = await this.getModel();
        model.campaign = this.campaign;
        model.reminderCampaign = this.reminderCampaign;
        model.contentPath = this.contentPath;

        const saved = await firestoreService.save(model);
        const savedJson = await saved.toJSON();
        console.log("Saved ReflectionPrompt", chalk.yellow(JSON.stringify(savedJson, null, 2)));

        return;
    }


}