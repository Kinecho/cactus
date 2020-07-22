import * as express from "express";
import * as cors from "cors";
import { getActiveUserCountForTrailingDays } from "@api/analytics/BigQueryUtil";
import { getOperation, } from "@api/endpoints/DataExportJob";
import * as Sentry from "@sentry/node";
import GoogleSheetsService, { DataResult } from "@admin/services/GoogleSheetsService";
import GoogleLanguageService from "@admin/services/GoogleLanguageService";
import { getConfig } from "@admin/config/configService";
import * as uuid from "uuid/v4"
import * as admin from "firebase-admin"
import { DateTime } from "luxon";
import AdminPromptContentService from "@admin/services/AdminPromptContentService";
import * as DateUtil from "@shared/util/DateUtil";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import AdminSubscriptionService from "@admin/services/AdminSubscriptionService";
import AdminReflectionResponseService from "@admin/services/AdminReflectionResponseService";
import CactusMember, { DEFAULT_PROMPT_SEND_TIME, PromptSendTime } from "@shared/models/CactusMember";
import * as CustomSentPromptNotificationsJob from "@api/pubsub/subscribers/CustomSentPromptNotificationsJob";
import Logger from "@shared/Logger";
import { runMemberStatsJob } from "@api/pubsub/subscribers/MemberStatsJob";
import { stringifyJSON } from "@shared/util/ObjectUtil";
import ToneAnalyzerService from "@admin/services/ToneAnalyzerService";
import AdminSendgridService from "@admin/services/AdminSendgridService";
import AdminPromptNotificationManager from "@admin/managers/AdminPromptNotificationManager";
import { MemberPromptNotificationTaskParams } from "@admin/tasks/PromptNotificationTypes";
import { isBlank } from "@shared/util/StringUtil";
import AdminSentPromptService from "@admin/services/AdminSentPromptService";
import { PromptSendMedium } from "@shared/models/SentPrompt";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import AdminReflectionPromptService from "@admin/services/AdminReflectionPromptService";
import { AppType } from "@shared/types/DeviceTypes";

const logger = new Logger("testApp");
const app = express();
app.use(cors({ origin: true }));
app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', queryParams: req.query });
});

app.get("/fcm", async (req, res) => {
    try {
        logger.log("Staring the message send process");
        const title = (req.query.title as string | undefined) || "Cactus Test Push Message";
        const body = (req.query.body as string | undefined) || "This is the body of the request";
        // const token = (req.query.token as string | undefined) || "f2SB0VUqdaA:APA91bGV1o6f4UzsXOlwX_LYqCIKsH-STA4HCIIbMoUwzUd7zobmaICShlUchVvB2qPYjoZAmnjLl5fI6ntvrxSNfyWvWmkMkCGIGcqps0B-zl0dDci1aP9mEFmX0GvH7GmIflGgHCY6";
        const member = await AdminCactusMemberService.getSharedInstance().getMemberByEmail("neil@neilpoulin.com");
        const tokens = member?.fcmTokens ?? []

        const tasks = tokens.map(token => {
            const payload: admin.messaging.MessagingPayload = {
                notification: {
                    title: title,
                    body: body,
                    badge: (req.query.badge as string | undefined) || "1",
                }, data: {
                    promptId: (req.query.promptId as string | undefined) || "123",
                    promptEntryId: (req.query.entryId as string | undefined) || "entry123"
                }
            };
            return admin.messaging().sendToDevice(token, payload);
        })
        const allResults = await Promise.all(tasks);

        logger.info(stringifyJSON(allResults));
        return res.send(stringifyJSON(allResults));
    } catch (error) {
        logger.error("failed to send message", error);
        res.send(error);
    }
    return;

});

app.get("/stats", async (req, res) => {
    try {
        const size = req.query.size || 1000;
        console.log("starting member batches");
        const result = await runMemberStatsJob(Number(size));
        // let total = 0;

        console.log("finished all");
        res.send(result);
        return;
    } catch (error) {
        logger.error("Failed to execute query", error);
        res.send("Unable to process the request. an error was thrown: " + error.message);
    }

});

app.get("/operation", async (req, res) => {
    const name = req.query.name as string | undefined;
    if (!name) {
        res.send(400);
        return;
    }
    const operation = await getOperation(name);
    return res.send(operation);
});

app.get('/bq', async (req, resp) => {
    const results = await getActiveUserCountForTrailingDays(1);

    return resp.send({ results: results });
});

app.get("/send-time", async (req, res) => {
    const hour = req.query.h || undefined;
    const minute = req.query.m || undefined;
    const currentDate = new Date();
    const day = req.query.date || currentDate.getDate();
    const month = req.query.month || currentDate.getMonth();
    const year = req.query.y || currentDate.getFullYear();
    logger.log(`found hour=${ hour } and minute=${ minute }`);
    let sendTime: PromptSendTime | undefined = undefined;

    const systemDateObject = DateTime.local().setZone("utc").toObject();

    if (hour && minute) {
        sendTime = { hour: Number(hour), minute: DateUtil.getQuarterHourFromMinute(Number(minute)) };

        systemDateObject.day = Number(day);
        systemDateObject.year = Number(year);
        systemDateObject.month = Number(month);
        systemDateObject.minute = Number(minute);
        systemDateObject.hour = Number(hour);
    }
    const result = await CustomSentPromptNotificationsJob.runCustomNotificationJob({
        sendTimeUTC: sendTime,
        dryRun: true,
        systemDateObject: systemDateObject
    });
    logger.log("result", result);

    res.send(result)
});

app.get("/start-notif-task", async (req, resp) => {
    const email = req.query.email as string | undefined ?? "neil@cactus.app";
    const member = await AdminCactusMemberService.getSharedInstance().getMemberByEmail(email);
    const memberId = member?.id;
    if (!memberId) {
        resp.send({ error: `No member found for email ${ email }` });
        return;
    }
    const payload: MemberPromptNotificationTaskParams = {
        memberId,
        systemDateObject: DateTime.local().toObject(),
        promptSendTimeUTC: member?.promptSendTime ?? DEFAULT_PROMPT_SEND_TIME,
    }
    const result = await AdminPromptNotificationManager.shared.createDailyPromptSetupTask(payload);
    resp.send({ result });
    return;
})

/**
 * Create new sent prompt (if required) for a given user and prompt entry id
 */
app.post("/sent-prompt", async (req, resp) => {
    const { promptId, email, memberId } = req.body as { promptId?: string, email?: string, memberId?: string };
    if (!promptId || (isBlank(email) && isBlank(memberId))) {
        resp.send({ error: "You must provide a promptId and either email or memberId" });
        return
    }
    const member = memberId ? await AdminCactusMemberService.getSharedInstance().getById(memberId) : await AdminCactusMemberService.getSharedInstance().getMemberByEmail(email)
    if (!member) {
        resp.send({ error: `No member found for id=${ memberId ?? "none" } or email ${ email ?? "none" }` });
        return;
    }

    const promptContent = await AdminPromptContentService.getSharedInstance().getByEntryId(promptId);
    if (!promptContent) {
        resp.send({ error: `No prompt content found for prompt content entry id = ${ promptId }` });
        return;
    }

    const { sentPrompt, error } = AdminSentPromptService.createSentPrompt({
        member,
        promptContent,
        medium: PromptSendMedium.PROMPT_CONTENT,
        createHistoryItem: true
    });
    if (!sentPrompt) {
        resp.send({ message: "Unable to create a sent prompt", error })
        return;
    }

    await AdminSentPromptService.getSharedInstance().save(sentPrompt);
    resp.send({ sentPrompt, success: true });
    return;

});

/**
 * Create new free-form prompt
 */
app.post("/free-form-prompt", async (req, resp) => {
    const { title, email, memberId } = req.body as { title?: string, email?: string, memberId?: string };
    const completed = req.body.completed === "true" || Boolean(req.body.completed);

    if (isBlank(email) && isBlank(memberId)) {
        resp.send({ error: "You must provide a promptId and either email or memberId" });
        return
    }
    const member = await AdminCactusMemberService.getSharedInstance().findCactusMember({
        cactusMemberId: memberId,
        email,
    });
    if (!member) {
        resp.send({ error: `No member found for id=${ memberId ?? "none" } or email ${ email ?? "none" }` });
        return;
    }


    const prompt = ReflectionPrompt.createFreeForm({ memberId: member.id!, question: title, app: AppType.WEB });
    await AdminReflectionPromptService.getSharedInstance().save(prompt);

    const { sentPrompt, error } = AdminSentPromptService.createSentPrompt({
        member,
        prompt,
        medium: PromptSendMedium.FREE_FORM,
        createHistoryItem: true
    });

    if (!sentPrompt) {
        resp.send({ message: "Unable to create a sent prompt", error })
        return;
    }

    if (completed) {
        sentPrompt.completed = completed;
    }
    await AdminSentPromptService.getSharedInstance().save(sentPrompt);
    resp.send({ prompt, sentPrompt, success: true });
    return;

})

app.get("/send-notification-email", async (req, resp) => {
    const email = req.query.email as string | undefined ?? "neil@cactus.app";
    const member = await AdminCactusMemberService.getSharedInstance().getMemberByEmail(email);
    if (!member) {
        resp.status(400).send({ success: false, message: `No member found for email: "${ email }"` });
        return
    }

    const sendResult = await AdminSendgridService.getSharedInstance().sendPromptNotification({
        reflectUrl: "http://localhost:8080/home",
        email,
        isPlus: true,
        mainText: "This is test text from the test endpoint",
        memberId: member.id!,
        subjectLine: "[STAGE] Test endpoint",
        promptContentEntryId: "xxxx",
        isLastEmail: true,
    })

    const result = { success: true, message: "", sendResult };
    resp.send(result);
})

app.get("/member-send-time", async (req, resp) => {
    const memberId = req.query.memberId as string | undefined;
    const email = req.query.email as string | undefined;

    let member: CactusMember | undefined;
    if (!memberId && email) {
        member = await AdminCactusMemberService.getSharedInstance().getMemberByEmail(email);
    } else if (memberId) {
        member = await AdminCactusMemberService.getSharedInstance().getById(memberId);
    }

    if (!member) {
        resp.status(404);
        resp.send("No member found");
        return;
    }
    logger.log('Found a member:');
    logger.log(member);
    const result = await AdminCactusMemberService.getSharedInstance().updateMemberSendPromptTime(member);
    return resp.send(result || "none")
});

app.get("/expire-trial", async (req, resp) => {
    const memberId = req.query.memberId as string | undefined;
    const email = req.query.email as string | undefined;
    let member: CactusMember | undefined;
    if (!memberId && email) {
        member = await AdminCactusMemberService.getSharedInstance().getMemberByEmail(email);
    } else if (memberId) {
        member = await AdminCactusMemberService.getSharedInstance().getById(memberId);
    }

    if (!member?.id) {
        resp.status(404);
        resp.send("No member found");
        return;
    }
    logger.log('Found a member:');
    logger.log(member);

    const result = await AdminSubscriptionService.getSharedInstance().expireTrial(member);
    return resp.send(result || "none")
});

app.get("/member-stats", async (req, resp) => {
    const memberId = req.query.memberId as string | undefined;
    const email = req.query.email as string | undefined;
    let member: CactusMember | undefined;
    if (!memberId && email) {
        member = await AdminCactusMemberService.getSharedInstance().getMemberByEmail(email);
    } else if (memberId) {
        member = await AdminCactusMemberService.getSharedInstance().getById(memberId);
    }

    if (!member?.id) {
        resp.status(404);
        resp.send("No member found");
        return;
    }
    logger.log('Found a member:');
    logger.log(member);

    const result = await AdminReflectionResponseService.getSharedInstance().calculateStatsForMember({
        memberId: member.id,
        timeZone: member?.timeZone ? member.timeZone.toString() : undefined
    });
    return resp.send(result || "none")
});

app.get("/member-word-cloud", async (req, resp) => {
    const memberId = req.query.memberId as string | undefined;
    const email = req.query.email as string | undefined;
    let member: CactusMember | undefined;
    if (!memberId && email) {
        member = await AdminCactusMemberService.getSharedInstance().getMemberByEmail(email);
    } else if (memberId) {
        member = await AdminCactusMemberService.getSharedInstance().getById(memberId);
    }

    if (!member?.id) {
        resp.status(404);
        resp.send("No member found");
        return;
    }
    logger.log('Found a member:');
    logger.log(member);

    const result = await AdminReflectionResponseService.getSharedInstance().aggregateWordInsightsForMember({ memberId: member.id });
    return resp.send(result || "none")
});

app.get("/content", async (req, resp) => {
    logger.log("Trying to fetch content");
    const qDate = req.query.d as string | undefined;
    let d = DateUtil.getDateAtMidnightDenver();
    if (qDate) {
        logger.log("date input", qDate);
        d = DateUtil.localDateFromISOString(qDate) || d
    }

    logger.log("local date ", d);
    const content = await AdminPromptContentService.getSharedInstance().getPromptContentForDate({ systemDate: d });
    return resp.send((content && content.toJSON()) || "none")
});

app.get("/error", async (req, resp) => {
    try {
        // noinspection ExceptionCaughtLocallyJS
        throw new Error("This is a test API Error");
    } catch (e) {
        Sentry.captureException(e);
        return resp.sendStatus(500);
    }
});


app.get("/language-entities", async (req, resp) => {
    const text = req.query.text as string | undefined;

    if (!text) {
        resp.status(404);
        resp.send("No text found");
        return;
    }

    try {
        const entities = await GoogleLanguageService.getSharedInstance().getEntities(text);
        resp.send({
            success: true,
            data: entities
        });
    } catch (e) {
        resp.send({ error: e });
    }
});


app.get("/language-syntax", async (req, resp) => {
    const text = req.query.text as string | undefined;

    if (!text) {
        resp.status(404);
        resp.send("No text found");
        return;
    }

    try {
        const entities = await GoogleLanguageService.getSharedInstance().getSyntaxTokens(text);
        resp.send({
            success: true,
            data: entities
        });
    } catch (e) {
        resp.send({ error: e });
    }
});

app.get("/language-words", async (req, resp) => {
    const text = req.query.text as string | undefined;

    if (!text) {
        resp.status(404);
        resp.send("No text found");
        return;
    }

    try {
        const entities = await GoogleLanguageService.getSharedInstance().insightWords(text);
        resp.send({
            success: true,
            data: entities
        });
    } catch (e) {
        resp.send({
            success: false,
            error: e
        });
    }
});

app.get("/sheets", async (req, resp) => {
    const config = getConfig();
    try {
        const spreadsheet = await GoogleSheetsService.getSharedInstance().getSpreadsheet(config.sheets.prompt_content_sheet_id);
        resp.send({
            success: true,
            title: spreadsheet.properties ? spreadsheet.properties.title : "Unknown",
            data: spreadsheet
        });

    } catch (e) {
        resp.send({ error: e });
    }
});


app.get("/sheets/values", async (req, resp) => {
    const config = getConfig();
    try {
        const values = await GoogleSheetsService.getSharedInstance().readSpreadsheet(config.sheets.prompt_content_sheet_id);

        const processed: DataResult<{ firstName: string, lastName: string }> = GoogleSheetsService.valuesToJson({
            values: values.values ? [...values.values] : undefined,
            hasHeaderRow: true,
            // headers,
        });

        resp.send({
            success: true,
            values,
            data: processed
        });


    } catch (e) {
        logger.error(e);
        resp.send({ error: e });
    }
});


app.get("/sheets/process", async (req, resp) => {
    const config = getConfig();
    try {
        const spreadsheet = await GoogleSheetsService.getSharedInstance().getSpreadsheet(config.sheets.prompt_content_sheet_id);
        if (!spreadsheet || !spreadsheet.sheets) {
            resp.send({ error: "No spreadsheet or sheets found", spreadsheet, });
            return
        }


        const fromSheet = spreadsheet.sheets.find(sheet => sheet && sheet.properties && sheet.properties.sheetId === 0 || false);
        const toSheet = spreadsheet.sheets.find(sheet => sheet && sheet.properties && sheet.properties.sheetId === 77624666 || false);

        if (!fromSheet || !toSheet || !fromSheet.properties || !toSheet.properties) {
            resp.send({ error: "Unable to find from and to sheets", fromSheet, toSheet });
            return;
        }

        const startRange = `'${ fromSheet.properties.title }'!A:Z`;

        const values = await GoogleSheetsService.getSharedInstance().readSpreadsheet(config.sheets.prompt_content_sheet_id, startRange);

        const data: DataResult<{ firstName: string, lastName: string }> = GoogleSheetsService.valuesToJson({
            values: values.values ? [...values.values] : undefined,
            hasHeaderRow: true,
            // headers,
        });


        const processed = data.rows.map(obj => {
            return {
                ...obj,
                data: {
                    ...obj.data,
                    id: uuid(),
                }

            }
        });

        const processedFields = [...data.fieldNames, "id"];

        const writeResult = await GoogleSheetsService.getSharedInstance().writeValues({
            sheetName: toSheet.properties.title || "",
            spreadsheetId: config.sheets.prompt_content_sheet_id,
            fieldNames: processedFields,
            rows: processed,
        });

        resp.send({
            success: true,
            values,
            dataInput: data,
            writeResult,
        });


        // const


    } catch (e) {
        logger.error(e);
        resp.send({ error: e });
    }
});


app.get("/sheets/update", async (req, resp) => {
    const config = getConfig();
    const first = req.query.first as string | undefined ?? "";
    const last = req.query.last as string | undefined ?? "";
    const range = req.query.range as string | undefined ?? "";
    try {
        const updateResponse = await GoogleSheetsService.getSharedInstance().updateValues(config.sheets.prompt_content_sheet_id, range, [[first, last]]);
        resp.send({
            success: true,
            data: updateResponse
        });

    } catch (e) {
        logger.error(e);
        resp.send({ error: e });
    }
});

app.get("/sheets/add", async (req, resp) => {
    const config = getConfig();
    const first = req.query.first;
    const last = req.query.last;
    try {
        const updateResponse = await GoogleSheetsService.getSharedInstance().appendValues(config.sheets.prompt_content_sheet_id, "A:B", [[first, last]]);
        resp.send({
            success: true,
            data: updateResponse
        });

    } catch (e) {
        logger.error(e);
        resp.send({ error: e });
    }
});

app.get("/watson", async (req, resp) => {
    const text = req.query.text as string;
    const data = await ToneAnalyzerService.shared.watsonBasicSdk(text)
    resp.send({ watson: data });
})

app.get("/sentiment", async (req, resp) => {
    const text = req.query.text as string;

    const data = await GoogleLanguageService.getSharedInstance().getSentiment(text)
    resp.send({ google: data });

})

export default app;