import {FirebaseCommand} from "@scripts/CommandTypes";
import * as admin from "firebase-admin";
import AdminFirestoreService from "@shared/services/AdminFirestoreService";
import helpers from "@scripts/helpers";
import chalk from "chalk";
import {getCactusConfig, Project} from "@scripts/config";
import MailchimpService from "@shared/services/MailchimpService";
import {CampaignContent} from "@shared/mailchimp/models/CreateCampaignRequest";
import {Collection} from "@shared/FirestoreBaseModels";
import {fromDocumentSnapshot} from "@shared/util/FirebaseUtil";
import SentCampaign from "@shared/models/SentCampaign";
import {Campaign, CampaignStatus} from "@shared/mailchimp/models/MailchimpTypes";
import {URL} from "url";
import ReflectionPrompt, {Field} from "@shared/models/ReflectionPrompt";
const prompts = require("prompts");
import * as fs from "fs";
import {promisify} from "util";
import * as osPath from "path";
const writeFile =  promisify(fs.writeFile);

const getUrls = require('get-urls');

interface Page {
    title: string,
    path: string,
    reflectionPrompt?: boolean,
    name: string,
}

const pages: { [pageName: string]: Page } = helpers.webHelpers.pagesFile;


Object.keys(pages).forEach(pageName => {
    const page = pages[pageName];
    page.name = pageName;
});

const reflectionPromptPages = Object.values(pages).filter((page) => {
    return page.reflectionPrompt;
});

interface PageMatch {
    page: Page,
    campaignId: string,
    campaign?: Campaign,
    reminderId?: string,
    reminderCampaign?: Campaign,
    content: CampaignContent
    reminderContent: CampaignContent,
}

export default class BackfillPagesCommand extends FirebaseCommand {
    name = "Backfill Reflection Prompts";
    description = "Use existing pages to backpopulate Reflection Prompts";
    showInList = true;
    project = Project.PROD;
    campaignsById: { [id: string]: Campaign | undefined } = {};


    constructor() {
        super();


    }

    findPageByPath(path: string): Page | undefined {
        return reflectionPromptPages.find(page => {
            return page.path === path;
        });
    }

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService): Promise<void> {
        const stageConfig = await getCactusConfig(Project.STAGE);
        const prodConfig = await getCactusConfig(Project.PROD);
        const prodMailchimpService = new MailchimpService(prodConfig.mailchimp.api_key, prodConfig.mailchimp.audience_id);
        // @ts-ignore
        const stageMailchimpService = new MailchimpService(stageConfig.mailchimp.api_key, stageConfig.mailchimp.audience_id);
        //
        //
        //
        const mailchimpService = this.project === Project.STAGE ? stageMailchimpService : prodMailchimpService;

        // const mail


        const config = await getCactusConfig(this.project);
        MailchimpService.initialize(config.mailchimp.api_key, config.mailchimp.audience_id);

        console.log(chalk.blue("Pages:"));

        console.log(chalk.blue("\nCampaigns"));
        const contentById: { [key: string]: CampaignContent } = {};
        const campaigns = await mailchimpService.getAllCampaigns({
            params: {
                list_id: config.mailchimp.audience_id,
                status: CampaignStatus.sent,
                exclude_fields: ["campaigns._links"]
            },
            pagination: {count: 50}
        });
        // const campaigns = (await mailchimpService.getCampaigns({pagination: {count: 4, offset: 1}})).campaigns;

        campaigns.forEach(campaign => {
            this.campaignsById[campaign.id] = campaign;
            console.log("Fetched campaign", campaign.id);
        });

        console.log("fetched campaigns");

        const contentTasks = campaigns.map(async (campaign, i) => {
            console.log(campaign.settings.title);
            const campaignId = campaign.id;
            return new Promise(async resolve => {
                setTimeout(async () => {
                    const content = await this.getCampaignContent(campaignId, mailchimpService, firestoreService);
                    if (content) {
                        contentById[campaignId] = content;
                    }
                    resolve();
                }, i * 200)

            })
        });

        await Promise.all(contentTasks);


        console.log("processing content...");
        const matchesByPageName: {[pageName: string]: PageMatch} = {};

        Object.keys(contentById).forEach(campaignId => {
            console.log("Processing content for campaignId", campaignId);
            const content = contentById[campaignId];
            if (!content || (!content.html && !content.plain_text)) {
                return;
            }

            const contentUrls = getUrls(content.html || content.plain_text, {sortQueryParameters: false});
            if (!contentUrls) {
                return;
            }
            const urls: Array<string> = Array.from(contentUrls);


            urls.forEach((urlString: string) => {
                if (urlString.includes("cactus.app")) {
                    const url = new URL(urlString);
                    const path = url.pathname;
                    const matchedPage = this.findPageByPath(path);
                    if (matchedPage) {

                        const campaign = this.campaignsById[campaignId];
                        if (!campaign){
                            console.error(chalk.red("No campaign found for campaignId", campaignId));
                            return;
                        }

                        const pageMatch = matchesByPageName[matchedPage.name] || {page: matchedPage};

                        const campaignTitle = campaign.settings.title;
                        console.log("campaign title", campaignTitle);

                        if (campaignTitle.toLowerCase().includes("reminder")){
                            pageMatch.reminderCampaign = campaign;
                            pageMatch.reminderId = campaignId;
                            pageMatch.reminderContent = content;
                        } else {
                            pageMatch.campaign = campaign;
                            pageMatch.campaignId = campaignId;
                            pageMatch.content = content;
                        }

                        console.log(chalk.green("matched page", matchedPage.title));

                        matchesByPageName[matchedPage.name] = pageMatch;
                    }
                }
            });



        });
        await this.processMatches(Object.values(matchesByPageName), firestoreService);

        return undefined;
    }

    async processMatches(matches:PageMatch[], firestoreService:AdminFirestoreService){
        console.log("about to process", matches.length, "page matches");

        const dateId = (new Date()).getTime();
        const filePath = osPath.resolve(helpers.scriptsRoot, "output", `${dateId}_all_matches.json`);
        const matchesToCreateFilePath = osPath.resolve(helpers.scriptsRoot, "output", `${dateId}_matches_to_create.json`);
        const folder = osPath.dirname(filePath);
        try {
            await promisify(fs.mkdir)(folder, {recursive: true});
        } catch (error){
            // console.debug("Unable to create folder " + folder, error);
        }
        await writeFile(filePath, JSON.stringify(matches, null, 2));

        const existingMatches:PageMatch[] = [];
        const matchesToCreate:PageMatch[] = [];

        const tasks = matches.map(match => {
            return new Promise(async resolve => {
                if (!match.reminderId && match.campaignId){
                    console.warn(chalk.yellow(`can't process match ${match.page.name} as no campaign ids were found`));
                }


                let existingPrompts:ReflectionPrompt[] = [];
                const campaignQuery = firestoreService.getCollectionRef(Collection.reflectionPrompt).where(Field.campaignIds, "array-contains", match.campaignId);
                const foundCampaignPrompts = await firestoreService.executeQuery(campaignQuery, ReflectionPrompt);
                if (foundCampaignPrompts.size === 0 && match.reminderId){
                    const reminderQuery = firestoreService.getCollectionRef(Collection.reflectionPrompt).where(Field.campaignIds, "array-contains", match.reminderId);
                    const foundReminderPrompts = await firestoreService.executeQuery(reminderQuery, ReflectionPrompt);
                    if (foundReminderPrompts.size > 0){
                        existingPrompts = foundReminderPrompts.results;
                    }
                } else {
                    existingPrompts = foundCampaignPrompts.results;
                }

                if (existingPrompts.length === 1){
                    resolve(existingPrompts[0]);
                    existingMatches.push(match);
                    return
                } else if (existingPrompts.length > 1){
                    console.warn(chalk.yellow(`More than 1 prompt found for campaignId=${match.campaignId} or reminderId ${match.reminderId}. Using first one`));
                    existingMatches.push(match);
                    resolve(existingPrompts[0]);
                    return;
                }

                console.log(chalk.green("no existing prompts found, need to create one for page", match.page.name));
                matchesToCreate.push(match);

                resolve();
            })
        });


        await Promise.all(tasks);


        console.log(chalk.blue(`Found ${existingMatches.length} existing prompts!`));
        console.log(chalk.blue(`Need to Create ${matchesToCreate.length} new prompts from existing campaigns`));
        await writeFile(matchesToCreateFilePath, JSON.stringify(matchesToCreate, null, 2));
        const mailchimpService = MailchimpService.getSharedInstance();
        const questions = [];

        const campaignReminderChoices =  Object.values(this.campaignsById).filter(campaign => campaign && campaign.settings.title.toLowerCase().includes("reminder"))
            .map((campaign) => {
                if (!campaign){
                    return {title: "", value: ""};
                }
                return {title: campaign.settings.title, value: campaign.id}});

        for (let i=0; i < matchesToCreate.length; i++){
            const match = matchesToCreate[i];
            if (match.campaign && (!match.reminderId && !match.reminderCampaign) ){
                const questionName = match.campaign.id || "unknown";
                console.log("setting up question name", questionName);
                const titleSplit = match.campaign.settings.title.toLowerCase().split("daily");
                questions.push({
                    type: "autocomplete",
                    name: questionName,
                    message: `What is the Reminder Campaign ID for \"${match.campaign.settings.title}\"?`,
                    choices: campaignReminderChoices,
                    initial: titleSplit ? titleSplit[titleSplit.length - 1] : "",
                    suggest: (input:string, choices:{title:string, value:string}[]) =>
                        Promise.resolve(choices.filter(choice => choice.title.toLowerCase().includes(input.toLowerCase()) ))
                });

               // console.log("got reminderId", reminderId);
            }
        }


        console.log("there are ", questions.length, "to ask", JSON.stringify(questions, null, 2));

        const questionResponses = await prompts(questions);


        const createTasks = matchesToCreate.map(match => {
            return new Promise(async resolve => {
                const prompt = new ReflectionPrompt();

                prompt.contentPath = match.page.path;
                prompt.question = match.page.title;
                prompt.baseFileName = match.page.name;
                prompt.campaign = match.campaign;
                prompt.reminderCampaign = match.reminderCampaign;
                prompt.deleted = false;
                prompt.createdAt = new Date();
                prompt.updatedAt = new Date();

                if (!match.reminderId && questionResponses[match.campaignId]){
                    const reminderCampaignId = questionResponses[match.campaignId];
                    try {
                        const reminderCampaign = await mailchimpService.getCampaign(reminderCampaignId);
                        if (reminderCampaign){
                            prompt.reminderCampaign = reminderCampaign;
                        }
                    }catch (error){
                        console.warn("unable to get reminder campaign ", reminderCampaignId);
                    }


                }

                await firestoreService.save(prompt);

                console.log("saved new prompt to db: ", prompt.question);
                resolve(prompt);
            })
        });

        await Promise.all(createTasks);


    }

    async getCampaignContent(campaignId: string, mailchimpService: MailchimpService, firestoreService: AdminFirestoreService): Promise<CampaignContent | undefined> {

        const sentCampaignDoc = await firestoreService.getCollectionRef(Collection.sentCampaigns).doc(campaignId).get();

        let sentCampaign = await fromDocumentSnapshot(sentCampaignDoc, SentCampaign);
        if (sentCampaign && sentCampaign.content) {
            // console.log("Got sent campaign from firestore");
            return sentCampaign.content;
        }


        const content = await mailchimpService.getCampaignContent(campaignId);

        if (content) {
            if (sentCampaign) {
                console.log("saving content to db");
                sentCampaign.content = content;

            } else {
                console.log("Creating new sent campaign");
                const campaign = this.campaignsById[campaignId];
                sentCampaign = new SentCampaign();
                sentCampaign.content = content;
                sentCampaign.campaign = campaign;
                sentCampaign.id = campaignId;
            }

            await firestoreService.save(sentCampaign);
            console.log("saved content to db");
            return content;
        } else {
            // console.log(chalk.red("...no content"));
            return;
        }
    }

}