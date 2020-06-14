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
import { DateObject, DateTime } from "luxon";
import AdminPromptContentService from "@admin/services/AdminPromptContentService";
import * as DateUtil from "@shared/util/DateUtil";
import { runJob as startSentPromptJob } from "@api/pubsub/subscribers/DailySentPromptJob";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import AdminSubscriptionService from "@admin/services/AdminSubscriptionService";
import AdminReflectionResponseService from "@admin/services/AdminReflectionResponseService";
import CactusMember, { PromptSendTime } from "@shared/models/CactusMember";
import * as CustomSentPromptNotificationsJob from "@api/pubsub/subscribers/CustomSentPromptNotificationsJob";
import Logger from "@shared/Logger";
import { runMemberStatsJob } from "@api/pubsub/subscribers/MemberStatsJob";
import { stringifyJSON } from "@shared/util/ObjectUtil";

const logger = new Logger("testApp");
// const Config = getConfig();
const app = express();
// app.use(cors({origin: Config.allowedOrigins}));
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
        let tokens = member?.fcmTokens ?? []

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
        // logger.log("Send Message Result", result);

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

app.get("/next-prompt", async (req, res) => {
    let memberId = req.query.memberId as string | undefined;
    const email = req.query.email as string | undefined;
    const runJob: boolean = !!req.query.run;
    let member: CactusMember | undefined;
    if (!memberId && email) {
        member = await AdminCactusMemberService.getSharedInstance().getMemberByEmail(email);
    } else if (memberId) {
        member = await AdminCactusMemberService.getSharedInstance().getById(memberId);
    }

    if (!member) {
        res.status(404);
        res.send("No member found");
        return;
    }

    memberId = member.id;

    logger.log("Got member", memberId, member.email);
    logger.log("getting next prompt for member Id", memberId);

    const userTZ = member.timeZone;
    // let systemDate = new Date();
    const systemDate = new Date();
    const systemDateObject = DateTime.local().toObject();
    let userDateObject: DateObject = systemDateObject;
    if (userTZ) {
        logger.log("timezone =", userTZ);
        userDateObject = DateUtil.getDateObjectForTimezone(systemDate, userTZ);
        logger.log("user date obj", userDateObject);
        logger.log("user date (locale)", userDateObject.toLocaleString())
    }


    let memberResult: CustomSentPromptNotificationsJob.MemberResult | undefined;
    if (runJob) {
        const job = { dryRun: false };
        memberResult = await CustomSentPromptNotificationsJob.processMember({ job, member });
    }

    res.send({
        memberTimeZone: userTZ,
        userDate: DateTime.fromObject(userDateObject).toJSDate().toLocaleString(),
        systemDate: systemDate.toLocaleString(),
        userDateObject: userDateObject,
        systemDateObject: systemDateObject,
        promptSentTimePreference: member.promptSendTime,
        memberJobResult: memberResult ? {
            ...memberResult,
            promptContent: memberResult?.promptContent?.toJSON(["_fl_meta_"]) || null,
            sentPrompt: memberResult?.sentPrompt?.toJSON() || undefined,
        } : "NOT PROCESSED",
    });
});

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

app.get("/contentJob", async (req, resp) => {
    logger.log("Trying to fetch content");
    const qDate = req.query.d as string | undefined;
    let d = DateUtil.getDateAtMidnightDenver();
    if (qDate) {
        d = DateUtil.localDateFromISOString(qDate) || d;
    }
    logger.log("testApi: content Date", DateUtil.getISODate(d));
    const result = await startSentPromptJob(d, undefined, true);
    return resp.send(result);
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

export default app;