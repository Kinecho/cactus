import * as express from "express";
import * as cors from "cors";
import {getActiveUserCountForTrailingDays} from "@api/analytics/BigQueryUtil";
import {
    getOperation,
} from "@api/endpoints/DataExportJob";
import * as Sentry from "@sentry/node";
import GoogleSheetsService, {DataResult} from "@shared/services/GoogleSheetsService";
import {getConfig} from "@api/config/configService";
import * as uuid from "uuid/v4"
// const Sentry = require('@sentry/node');
const app = express();
app.use(cors({origin: true}));
app.get('/', (req, res) => {
    res.status(200).json({status: 'ok', queryParams: req.query});
});

app.get("/operation", async (req, res) => {
    const name = req.query.name;
    const operation = await getOperation(name);
    return res.send(operation);
});

app.get('/bq', async (req, resp) => {
    const results = await getActiveUserCountForTrailingDays(1);

    return resp.send({results: results});
});

app.get("/error", async (req, resp) => {
    try {
        throw new Error("This is a test API Error");
    } catch (e) {
        Sentry.captureException(e);
        return resp.sendStatus(500);
    }
    resp.send("done");
    return;

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
        resp.send({error: e});
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
        console.error(e);
        resp.send({error: e});
    }
});


app.get("/sheets/process", async (req, resp) => {
    const config = getConfig();
    try {
        const spreadsheet = await GoogleSheetsService.getSharedInstance().getSpreadsheet(config.sheets.prompt_content_sheet_id);
        if (!spreadsheet || !spreadsheet.sheets) {
            resp.send({error: "No spreadsheet or sheets found", spreadsheet,});
            return
        }


        const fromSheet = spreadsheet.sheets.find(sheet => sheet && sheet.properties && sheet.properties.sheetId === 0 || false);
        const toSheet = spreadsheet.sheets.find(sheet => sheet && sheet.properties && sheet.properties.sheetId === 77624666 || false);

        if (!fromSheet || !toSheet || !fromSheet.properties || !toSheet.properties) {
            resp.send({error: "Unable to find from and to sheets", fromSheet, toSheet});
            return;
        }


        const startRange = `'${fromSheet.properties.title}'!A:Z`;

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
        console.error(e);
        resp.send({error: e});
    }
});


app.get("/sheets/update", async (req, resp) => {
    const config = getConfig();
    const first = req.query.first;
    const last = req.query.last;
    const range = req.query.range;
    try {
        const updateResponse = await GoogleSheetsService.getSharedInstance().updateValues(config.sheets.prompt_content_sheet_id, range, [[first, last]]);
        resp.send({
            success: true,
            data: updateResponse
        });

    } catch (e) {
        console.error(e);
        resp.send({error: e});
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
        console.error(e);
        resp.send({error: e});
    }
});

export default app;