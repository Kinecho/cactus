import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@shared/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {Project} from "@scripts/config";
import {CactusConfig} from "@shared/CactusConfig";
import {DocumentSnapshot} from "firebase-functions/lib/providers/firestore";
import AdminSentPromptService from "@shared/services/AdminSentPromptService";
import helpers from "@scripts/helpers";
import * as  path from "path";
import SentPrompt from "@shared/models/SentPrompt";
import AdminCactusMemberService from "@shared/services/AdminCactusMemberService";
import {DateTime} from "luxon";
import {formatDate} from "@shared/util/DateUtil";

const csv = require('csvtojson')
const prompts = require("prompts");


const onboardingDelayedBefore = DateTime.fromObject({month: 5, day: 31, year: 2019, hour: 16, zone: 'America/Denver'});

interface OnboardingDayRow {
    day: string,
    campaignId: string,
    web_id: string,
    contentPath: string,
    promptId: string,
    question: string
}

interface OnboardingDay {
    day: number,
    campaignId: string,
    web_id: number,
    contentPath: string,
    promptId: string,
    question: string
}

export default class SentPromptCreatedAtBackfillCommand extends FirebaseCommand {
    name = "Sent Prompt: Adjust Automation Send Date";
    description = "Set the send date relative to the member's registration date and the onboarding offset";
    showInList = true;

    successes: any = [];
    errors: any = [];

    onboardingByPromptId: { [promptId: string]: OnboardingDay } = {};
    onboardingData: OnboardingDay[] = [];

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);


        await this.configData();

        const updateTasks: Promise<void>[] = [];
        const query = AdminSentPromptService.getSharedInstance().getCollectionRef().where(SentPrompt.Fields.cactusMemberId, "==", "fFKwKrKHggouOmbWmwBv");
        const snapshot = await query.get();

        const continueResponse: { continue: boolean } = await prompts({
            name: "continue",
            message: `Do you want to process ${snapshot.size} items now?`,
            type: "confirm"
        });

        if (!continueResponse.continue) {
            console.log("Exiting");
        }

        snapshot.forEach(doc => {
            const promptId = doc.get(SentPrompt.Fields.promptId);
            if (this.onboardingByPromptId[promptId]) {
                updateTasks.push(this.handleSentPrompt(doc));
            }
        });


        console.log(`Handling ${updateTasks.length} tasks`);


        try {
            await Promise.all(updateTasks);
            console.log(`Finished updating sentPrompts. Success count ${this.successes.length} | Error count ${this.errors.length} `);
        } catch (error) {
            console.error("Error updating responses", error);
        }


        return;
    }

    async configData() {
        const rows: OnboardingDayRow[] = await csv().fromFile(path.join(helpers.dataDir, "onboarding_days.csv"))
        this.onboardingData = rows.map((row: OnboardingDayRow) => {
            return {
                day: Number(row.day),
                promptId: row.promptId,
                campaignId: row.campaignId,
                web_id: Number(row.web_id),
                contentPath: row.contentPath,
                question: row.question,
            }
        });

        this.onboardingByPromptId = this.onboardingData.reduce((map: { [day: string]: OnboardingDay }, day) => {
            map[day.promptId] = day;
            return map;
        }, {});

    }

    handleSentPrompt(doc: DocumentSnapshot): Promise<void> {
        return new Promise(async resolve => {
            try {
                const promptId = doc.get(SentPrompt.Fields.promptId) as string;
                const onboardingDay = this.onboardingByPromptId[promptId];
                const offsetDays: number = onboardingDay.day;
                const cactusMemberId = doc.get(SentPrompt.Fields.cactusMemberId) as string;

                const member = await AdminCactusMemberService.getSharedInstance().getById(cactusMemberId);
                if (!member) {
                    console.error(`No cacutus member found for memberId ${cactusMemberId}`);
                    this.errors.push(`No cacutus member found for memberId ${cactusMemberId}`);
                    resolve();
                    return;
                }
                const signupConfirmedAt = member.signupConfirmedAt;
                if (!signupConfirmedAt) {
                    console.error(`No created at date found for member ${member.email} id=${member.id}`);
                    this.errors.push(`No created at date found for member ${member.email} id=${member.id}`);
                    resolve();
                    return
                }

                let additionalOffset = 0;
                if (DateTime.fromJSDate(signupConfirmedAt) < onboardingDelayedBefore) {
                    additionalOffset = 1;
                    // console.log("user signed up before onboarding happened immediately. Increasing offset by 1")
                }

                const estimatedSendDate = DateTime.fromJSDate(signupConfirmedAt).plus({days: (offsetDays + additionalOffset)}).toJSDate();
                console.log(`signup ${formatDate(signupConfirmedAt)} - setting onboarding day ${offsetDays} date to ${formatDate(estimatedSendDate)}`);


                const result = await doc.ref.update({[SentPrompt.Fields.firstSentAt]: admin.firestore.Timestamp.fromDate(estimatedSendDate)});
                this.successes.push(result);

            } catch (error) {
                console.error(`failed to process sentPrompt ${doc.id}`);
                this.errors.push(error);
            }

            resolve()
        })
    }

}