import {FirebaseCommand} from "@scripts/CommandTypes";
import * as admin from "firebase-admin";
import AdminFirestoreService from "@shared/services/AdminFirestoreService";
import {Collection} from "@shared/FirestoreBaseModels";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import {fromDocumentSnapshot} from "@shared/util/FirestoreUtil";
import SentCampaign from "@shared/models/SentCampaign";
import {getDateFromISOString} from "@shared/util/DateUtil";
import {getCactusConfig, Project} from "@scripts/config";
import MailchimpService from "@shared/services/MailchimpService";

export default class ReflectionPromptSetSendTimeCommand extends FirebaseCommand {
    description = "Refresh the send time on all reflection prompts";
    name = "Reflection Prompts: update sendDate";
    showInList = true;

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService): Promise<void> {
        // const dateId = (new Date()).getTime();
        const query = await firestoreService.getCollectionRef(Collection.reflectionPrompt);
        const reflectionPrompts = await firestoreService.executeQuery(query, ReflectionPrompt);


        const project = this.project || Project.STAGE;

        const config = await getCactusConfig(project);
        const mailchimpService = new MailchimpService(config.mailchimp.api_key, config.mailchimp.audience_id);


        const tasks: Promise<void>[] = [];
        reflectionPrompts.results.forEach(prompt => {

            tasks.push(new Promise<void>(async resolve => {
                const promptSendDate = prompt.sendDate;

                if (promptSendDate) {
                    resolve();
                    return
                }

                let needsSave = false;
                let campaign = prompt.campaign;
                let campaignSendTime = campaign ? campaign.send_time : null;
                if (campaign && campaign.id && !campaignSendTime) {
                    const campaignRef = firestoreService.getCollectionRef(Collection.sentCampaigns).doc(campaign.id);
                    const campaignDoc = await campaignRef.get();
                    const sentCampaign = fromDocumentSnapshot(campaignDoc, SentCampaign);

                    if (sentCampaign && sentCampaign.campaign) {
                        campaign = sentCampaign.campaign;


                        prompt.campaign = campaign;
                        campaignSendTime = campaign.send_time;
                        needsSave = true;
                    }

                    if (!campaignSendTime && campaign) {
                        console.log("Getting campaign from mailchimp!");
                        const mailchimpCampaign = await mailchimpService.getCampaign(campaign.id);
                        if (mailchimpCampaign) {
                            campaign = mailchimpCampaign;
                            prompt.campaign = campaign;
                            await campaignRef.set({campaign}, {merge: true});
                            console.log("Updated campaign in sent campaign table for campaignId", campaign.id);
                            campaignSendTime = campaign.send_time;
                            needsSave = true;
                        }
                    }
                }

                if (campaignSendTime) {
                    const sendDate = getDateFromISOString(campaignSendTime);
                    prompt.sendDate = sendDate || undefined;
                    needsSave = true;
                }

                if (needsSave) {
                    console.log("Saving send date as ", prompt.sendDate, "for id", prompt.id);
                    await firestoreService.save(prompt);
                }

                resolve();
            }))
        });

        await Promise.all(tasks);

        return undefined;
    }

}