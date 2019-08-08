import {FirebaseCommand} from "@scripts/CommandTypes";
import * as admin from "firebase-admin";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import {Collection} from "@shared/FirestoreBaseModels";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import {stringFromISODate} from "@shared/util/DateUtil";
import {writeToFile} from "@scripts/util/FileUtil";
import helpers from "@scripts/helpers";
import chalk from "chalk";
import {exec} from "child_process";
const prompts = require("prompts");

export default class DownloadPromptsCommand extends FirebaseCommand {
    description = "Save all prompts to a file";
    name = "Reflection Prompts: Download All";
    showInList = true;

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService): Promise<void> {
        const dateId = (new Date()).getTime();
        const query = await firestoreService.getCollectionRef(Collection.reflectionPrompt);
        const reflectionPrompts = await firestoreService.executeQuery(query, ReflectionPrompt);


        const results = reflectionPrompts.results.sort((a, b) => {
            const ca = a.campaign;
            const cb = b.campaign;

            if (ca && ca.send_time && cb && cb.send_time){
                return cb.send_time.localeCompare(ca.send_time)
            }
            if (a.question && b.question){
                return b.question.localeCompare(a.question);
            }
            return 0;
        });

        const parsed = results.map(prompt => {
            return {
                id: prompt.id,
                question: prompt.question,
                campaignId: prompt.campaign ? prompt.campaign.id : null,
                campaignWebId: prompt.campaign ? prompt.campaign.web_id : null,
                sendDate: prompt.campaign ? stringFromISODate(prompt.campaign.send_time) : null,
                reminderCampaignId: prompt.reminderCampaign ? prompt.reminderCampaign.id : null,
                reminderCampaignWebI: prompt.reminderCampaign ? prompt.reminderCampaign.web_id : null,
                linkUrl: `https://cactus.app/${prompt.contentPath}`,

            }
        });

        const plain = results.map(prompt => {
            const dateString = stringFromISODate(prompt.campaign ? prompt.campaign.send_time : null);

            return (dateString ? dateString + " " : "") + prompt.question || "";
        }).filter(input => input.trim().length > 0);

        const data = JSON.stringify(parsed, null, 2);

        const fileNameJson = `${helpers.outputDir}/${dateId}_reflection_prompts.json`;
        const fileNameText = `${helpers.outputDir}/${dateId}_reflection_prompts.txt`;
        await writeToFile(fileNameJson, data);
        await writeToFile(fileNameText, plain.join("\n"));

        console.log(chalk.green(`Saved text file to ${fileNameText}`));
        console.log(chalk.green(`Saved JSON file to ${fileNameJson}`));

        const jsonOpenResponse:{doOpen:boolean} = await prompts({
            type: "confirm",
            message: "Do you want to the JSON file on your computer?",
            name: "doOpen"
        });

        if (jsonOpenResponse.doOpen){
            exec(`open ${fileNameJson}`);
        }

        const textOpenResponse:{doOpen:boolean} = await prompts({
            type: "confirm",
            message: "Do you want to the Text file on your computer?",
            name: "doOpen"
        });

        if (textOpenResponse.doOpen){
            exec(`open ${fileNameText}`);
        }

        return undefined;
    }

}