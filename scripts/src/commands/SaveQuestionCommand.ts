import {Campaign} from "@shared/mailchimp/models/MailchimpTypes";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import {Project} from "@scripts/config";
import * as admin from "firebase-admin";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as chalk from "chalk";
import {FirebaseCommand} from "@scripts/CommandTypes";

export default class SaveQuestionCommand extends FirebaseCommand {
    question?:string;
    name = "Create Reflection Prompt";
    description = "Save a reflection prompt to the database";
    showInList = false;
    campaign?: Campaign;
    reminderCampaign?: Campaign;
    model?: ReflectionPrompt;
    contentPath?: string;
    baseFileName?:string;

    constructor(project: Project|undefined=undefined){
        super({useAdmin: true});
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
        const model = await this.getModel();
        model.campaign = this.campaign;
        model.reminderCampaign = this.reminderCampaign;
        model.contentPath = this.contentPath;
        model.baseFileName = this.baseFileName;
        model.question = this.question;
        const saved = await firestoreService.save(model);

        console.log(chalk.green(`Saved ReflectionPrompt successfully. ID = ${saved.id}`));

        return;
    }


}