import {Command} from "@scripts/CommandTypes";
import {chooseEnvironment} from "@scripts/questionUtil";
import {getCactusConfig, Project} from "@scripts/config";
import MailchimpService from "@shared/services/MailchimpService";
import chalk from "chalk";
import {writeToFile} from "@scripts/util/FileUtil";
import helpers from "@scripts/helpers";
const prompts = require("prompts");
const exec = require("child_process").exec;


export default class MailchimpSearchMembersCommand implements Command {
    name = "Mailchimp: Search Members";
    showInList =true;
    async start() {
        const projectResponse:{environment:Project} = await prompts(chooseEnvironment);
        const questionResponse:{query:string} = await prompts({
            name: "query",
            message: "What is your query?",
            type: "text",
        });


        const project = projectResponse.environment;

        const config = await getCactusConfig(project);
        const mailchimpService = new MailchimpService(config.mailchimp.api_key, config.mailchimp.audience_id);



        const query = questionResponse.query;
        console.log(chalk.blue(`searching for users in ${project} using audienceId ${config.mailchimp.audience_id} for a user using the string "${query}"`));
        const searchResult = await mailchimpService.searchMembers({query: query});

        const dateId = (new Date()).getTime();

        const fileName = `${helpers.outputDir}/${dateId}_search-members.json`;
        const data = JSON.stringify(searchResult, null, 2);
        await writeToFile(fileName, data);
        console.log(chalk.yellow(data));
        console.log(chalk.green(`\nResults saved to ${fileName}\n`));

        const doOpenResponse:{doOpen:boolean} = await prompts({
            type: "confirm",
            message: "Do you want to open this file on your computer?",
            name: "doOpen"
        });

        if (doOpenResponse.doOpen){
            exec(`open ${fileName}`);
        }
    }

}