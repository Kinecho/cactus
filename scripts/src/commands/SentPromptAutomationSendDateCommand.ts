import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {Project} from "@scripts/config";
import {CactusConfig} from "@admin/CactusConfig";
import {DocumentSnapshot} from "firebase-functions/lib/providers/firestore";
import AdminSentPromptService from "@admin/services/AdminSentPromptService";
import helpers from "@scripts/helpers";
import * as  path from "path";
import SentPrompt from "@shared/models/SentPrompt";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import {DateTime} from "luxon";
import {formatDateTime} from "@shared/util/DateUtil";
import * as fs from "fs";
import {writeToFile} from "@scripts/util/FileUtil";

const csv = require('csvtojson');
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

    dateId = `${(new Date()).getTime()}`;

    fileHandlers: { [id: string]: number } = {};

    onboardingByPromptId: { [promptId: string]: OnboardingDay } = {};
    onboardingData: OnboardingDay[] = [];

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);


        await this.configData();

        const updateTasks: Promise<void>[] = [];
        const query = AdminSentPromptService.getSharedInstance().getCollectionRef()
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
        } finally {
            console.log("closing file handlers", JSON.stringify(Object.values(this.fileHandlers)));
            Object.values(this.fileHandlers).forEach(fd => {

                fs.closeSync(fd);
            })
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

    async writeLine(memberId: string, text: string) {
        let fd: number;
        if (this.fileHandlers[memberId]) {
            fd = this.fileHandlers[memberId];
        } else {
            const filename = path.join(helpers.outputDir, `${this.dateId}_SentPromptAutomationSendDateCommand`, `${memberId}.txt`);
            await writeToFile(filename, "");
            fd = fs.openSync(filename, 'a');
            this.fileHandlers[memberId] = fd;
        }
        fs.appendFileSync(fd, `${text}\n`);
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


                let estimatedDatetime = DateTime.fromJSDate(signupConfirmedAt);

                // console.log("user signed up before onboarding happened immediately. Increasing offset by 1")
                let additionalOffsetDays = 0;
                if (DateTime.fromJSDate(signupConfirmedAt) < onboardingDelayedBefore) {
                    additionalOffsetDays = 1;
                    estimatedDatetime = estimatedDatetime.setZone('America/Denver')
                }

                if (offsetDays + additionalOffsetDays > 0) {
                    estimatedDatetime = estimatedDatetime.set({hour: 2, minute: 45}).setZone('America/Denver');
                }

                const estimatedSendDate = estimatedDatetime.plus({days: (offsetDays + additionalOffsetDays)}).toJSDate();

                const message = `${doc.get(SentPrompt.Fields.memberEmail)} | signup ${formatDateTime(signupConfirmedAt)} | onboarding day ${offsetDays} | send date ${formatDateTime(estimatedSendDate)} | signup offset ${offsetDays + additionalOffsetDays} (additional Offset ${additionalOffsetDays})`

                console.log(message);
                try {
                    await this.writeLine(`${doc.get(SentPrompt.Fields.cactusMemberId)}_${doc.get(SentPrompt.Fields.memberEmail)}`, message);
                } catch (e) {
                    console.error("failed to write to file", e);
                }


                const result = await doc.ref.update({[SentPrompt.Fields.firstSentAt]: admin.firestore.Timestamp.fromDate(estimatedSendDate)});
                this.successes.push(result);

            } catch (error) {
                console.error(`failed to process sentPrompt ${doc.id}`, error);
                this.errors.push(error);
            }

            resolve()
        });
    }

}