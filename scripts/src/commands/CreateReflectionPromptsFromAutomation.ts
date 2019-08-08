import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {Project} from "@scripts/config";
import MailchimpService from "@admin/services/MailchimpService";
import {CactusConfig} from "@shared/CactusConfig";
import {Automation, Campaign} from "@shared/mailchimp/models/MailchimpTypes";
import chalk from "chalk";
import AdminReflectionPromptService from "@admin/services/AdminReflectionPromptService";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";

const prompts = require("prompts");

export default class CreateReflectionPromptsFromAutomation extends FirebaseCommand {
    name = "Reflection Prompt: Create new prompts for Automation";
    description = "Select an automation and create/associate reflection prompts for each email. Will not create a web page.";
    showInList = true;

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);

        MailchimpService.initialize(config);

        console.log("Loading automations...");
        const automations = await MailchimpService.getSharedInstance().getAllAutomations(100);

        const automationChoices = automations.map((automation: Automation) => {
            return {
                title: `${automation.settings.title} - ${chalk.gray(`id: ${automation.id} | status: ${automation.status}`)}`,
                value: automation
            }
        });

        const selectedAutomation: { automation: Automation } = await prompts({
            name: "automation",
            message: "Select an automation to process",
            type: "autocomplete",
            choices: automationChoices
        });

        console.log(`Great! Processing automationId ${selectedAutomation.automation.id} - ${selectedAutomation.automation.settings.title}`);
        const automationId = selectedAutomation.automation.id;


        const emails = await MailchimpService.getSharedInstance().getAllAutomationEmailsForWorkflow(automationId);
        const emailTitles = emails.map(email => `${email.settings.title} | ${chalk.gray(`id: ${email.id} `)} `);
        console.log(`Found automation emails:\n ${chalk.cyan(emailTitles.join("\n"))}`);


        console.log("Fetching the actual campaigns from the automation emails...");
        const emailCampaigns = await MailchimpService.getSharedInstance().getCampaignsByIds(emails.map(email => email.id));
        console.log("");
        console.log("Got email campaigns:");
        emailCampaigns.forEach(campaign => {
            console.log(`${chalk.green(campaign.settings.title)} | ${chalk.gray(`id: ${campaign.id} | web_id: ${campaign.web_id}`)}`)
        });


        console.log("");
        console.log("");
        const continueResponse: { continue: boolean, updateReplyTo: boolean } = await prompts([
            {
                type: "confirm",
                name: "continue",
                message: "Does this look right? Ready to start creating the prompts?"
            },
            {
                type: (prev: boolean) => prev ? "confirm" : null,
                name: "updateReplyTo",
                message: "Set the SentFrom on the campaign to have the prompt id (e.g. hello+p_<prompt_id>)?"
            }
        ]);

        if (!continueResponse.continue) {
            console.log("Lame. Byyye!");
        }


        for (const campaign of emailCampaigns) {
            const prompt = await this.createPromptFromCampaignTask(campaign, continueResponse.updateReplyTo);
            if (!prompt) {
                console.log("prompt was undefined");
                return;
            }
            console.log(`PromptID: ${prompt.id} | question: ${prompt.question}`)

        }

        console.log("all tasks finished");

        return;
    }

    async createPromptFromCampaignTask(campaign: Campaign, updateReplyTo: boolean): Promise<ReflectionPrompt | undefined> {
        return new Promise<ReflectionPrompt | undefined>(async (resolve, reject) => {
            const existingPrompt = await AdminReflectionPromptService.getSharedInstance().getPromptForCampaignId(campaign.id);
            if (existingPrompt) {
                console.log(`Found an existing prompt for campaign ${campaign.id} | campaign_title: ${campaign.settings.title} | prompt_question: ${existingPrompt.question}`);

                const skipExistingResponse: { skip: boolean, createNew: boolean } = await prompts([
                    {
                        name: "skip",
                        type: "confirm",
                        message: "Do you want to skip processing this campaign (i.e. not create/modify any prompts)?"
                    },
                    {
                        name: "createNew",
                        type: (prev: boolean) => prev ? null : "confirm",
                        message: "Do you want to create a new prompt? (no will update the existing prompt)",
                    },
                ]);

                if (skipExistingResponse.skip) {
                    resolve(existingPrompt);
                    return
                }

                if (!skipExistingResponse.createNew) {
                    if (updateReplyTo && existingPrompt.id) {
                        await this.updateReplyTo(existingPrompt.id, campaign);
                    } else {
                        console.log("Nothing to do - returning");
                    }
                    resolve(existingPrompt);
                    return;
                }
            }
            console.log("");
            console.log("");
            console.log(`Let's confirm some stuff about the campaign ${chalk.underline.bold(campaign.settings.title)} (id: ${campaign.id} | web_id: ${campaign.web_id})`);
            const promptInfo: {
                question: string,
                contentPath?: string,
                topic?: string
            } = await prompts([
                {
                    name: "question",
                    type: "text",
                    message: "Prompt Question",
                    initial: campaign.settings.title
                },
                {
                    name: "topic",
                    type: "text",
                    message: "Prompt Topic (optional)",
                },
                {
                    name: "contentPath",
                    type: "text",
                    message: "Go Deeper Path (optional)",
                }
            ]);

            const prompt = new ReflectionPrompt();
            prompt.campaign = campaign;
            prompt.question = promptInfo.question;
            prompt.contentPath = promptInfo.contentPath;
            prompt.topic = promptInfo.topic;


            const savedPrompt = await AdminReflectionPromptService.getSharedInstance().save(prompt);
            if (updateReplyTo && savedPrompt.id) {
                await this.updateReplyTo(savedPrompt.id, campaign);
            }

            resolve(savedPrompt);
        })
    }

    async updateReplyTo(promptId: string, campaign: Campaign): Promise<Campaign> {
        const replyTo = `hello+p_${promptId}@cactus.app`;
        console.log(`Updating the reply to on the campaign to ${replyTo}`);
        return await MailchimpService.getSharedInstance().updateCampaign(campaign.id, {
            settings: {
                subject_line: campaign.settings.subject_line,
                from_name: campaign.settings.from_name,
                reply_to: replyTo
            }
        })
    }
}