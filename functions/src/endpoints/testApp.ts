import * as express from "express";
import * as cors from "cors";
import {getActiveUserCountForTrailingDays} from "@api/analytics/BigQueryUtil";
import {
    getOperation,
} from "@api/endpoints/DataExportJob";

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

    throw new Error("This is a test API Error");

    return resp.sendStatus(500);
});

export default app;