import {FirebaseCommand} from "@scripts/CommandTypes";
import * as admin from "firebase-admin";
import AdminFirestoreService from "@shared/services/AdminFirestoreService";
import helpers from "@scripts/helpers";
import {getCactusConfig, Project} from "@scripts/config";
import MailchimpService from "@shared/services/MailchimpService";
import {Collection} from "@shared/FirestoreBaseModels";
import {fromDocumentSnapshot} from "@shared/util/FirestoreUtil";
import SentCampaign from "@shared/models/SentCampaign";
import {Campaign, CampaignStatus} from "@shared/mailchimp/models/MailchimpTypes";

const prompts = require("prompts");
import chalk from "chalk";
import FieldValue = admin.firestore.FieldValue;

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

export default class RefreshMailchimpCampaignsCommand extends FirebaseCommand {
    name = "Mailchimp: Refresh Campaign Content";
    description = "Select campaigns to refresh in the database";
    showInList = true;
    campaignsById: { [id: string]: Campaign | undefined } = {};

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

        if (!this.project) {
            throw new Error("No project set");
        }

        const config = await getCactusConfig(this.project);
        MailchimpService.initialize(config);
        console.log("Loading mailchimp campaigns...");
        const campaigns = await mailchimpService.getAllCampaigns({
            params: {
                list_id: config.mailchimp.audience_id,
                status: CampaignStatus.sent,
                exclude_fields: ["campaigns._links"]
            },
            pagination: {count: 100}
        });

        const automationCampaigns = await mailchimpService.getAllAutomationEmailCampaigns(config.mailchimp.audience_id);
        console.log(`got ${automationCampaigns.length} automation campaigns`);
        campaigns.push(...automationCampaigns);
        // const campaigns = (await mailchimpService.getCampaigns({pagination: {count: 4, offset: 1}})).campaigns;

        campaigns.forEach(campaign => {
            this.campaignsById[campaign.id] = campaign;
            console.log("Fetched campaign", campaign.id);
        });


        const campaignChoices = campaigns.map(campaign => ({
            title: `${campaign.settings.title}` + chalk.gray(` type=${campaign.type} | id=${campaign.id} | web_id=${campaign.web_id}`),
            value: campaign.id
        }));

        console.log("fetched campaigns");


        const campaignSelectionResponse: { campaignIds: string[] } = await prompts({
            name: "campaignIds",
            message: "Select the campaigns you'd like to refresh",
            type: "autocompleteMultiselect",
            choices: campaignChoices,
            suggest: (input: string, choices: { title: string, value: string }[]) =>
                Promise.resolve(choices.filter(choice => choice.title.toLowerCase().includes(input.toLowerCase())))
        });


        console.log("refreshing", campaignSelectionResponse.campaignIds);


        const contentTasks = campaignSelectionResponse.campaignIds.map(async (campaignId, i) => {
            return new Promise(async resolve => {
                setTimeout(async () => {
                    console.log("Processing campaignId", campaignId);
                    const sentCampaign = await this.refreshCampaign(campaignId, mailchimpService, firestoreService);
                    resolve(sentCampaign);
                }, i * 200) //timeout so we don't get throttled via mailchimp

            })
        });

        const refreshedCampaigns = await Promise.all(contentTasks);
        console.log(`Refreshed ${refreshedCampaigns.length} campaigns`);


        return undefined;
    }

    async refreshCampaign(campaignId: string, mailchimpService: MailchimpService, firestoreService: AdminFirestoreService): Promise<SentCampaign> {
        const content = await mailchimpService.getCampaignContent(campaignId);
        const campaign = this.campaignsById[campaignId];


        const sentCampaignRef = firestoreService.getCollectionRef(Collection.sentCampaigns).doc(campaignId);
        const sentCampaignDoc = await sentCampaignRef.get();

        let sentCampaign = await fromDocumentSnapshot(sentCampaignDoc, SentCampaign);
        console.log(`existing sent campaign for ${campaignId} exists = ${sentCampaignDoc.exists}`);
        if (!sentCampaignDoc.exists || !sentCampaign) {
            console.log("Campaign did not exist in DB, creating it now ");
            sentCampaign = new SentCampaign();
            sentCampaign.createdAt = new Date();
        } else if (campaign && content && sentCampaignDoc.exists) {
            //clear the existing content so we don't merge it by accident
            console.log("clearning content so we can reset it for campaignId", campaignId);
            await sentCampaignRef.update({
                content: FieldValue.delete(),
                campaign: FieldValue.delete(),
            });
        }

        sentCampaign.id = campaignId;
        sentCampaign.campaign = campaign;
        sentCampaign.content = content;

        await firestoreService.save(sentCampaign);

        return sentCampaign;
    }

}