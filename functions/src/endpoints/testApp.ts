import * as express from "express";
import * as cors from "cors";
import {
    backupFirestore,
    getOperation,
    exportFirestoreToBigQuery
} from "@api/endpoints/DataExportJob";

const app = express();
app.use(cors({origin: true}));
app.get('/', (req, res) => {
    res.status(200).json({status: 'ok', queryParams: req.query});
});

app.get("/backups", async (req, res) => {
    await backupFirestore(undefined, undefined);
    res.send("done");
});

app.get("/bigquery", async (req, res) => {
    const results = await exportFirestoreToBigQuery();
    res.send({
        status: "done",
        results,
    });
});

app.get("/operation", async (req, res) => {
    const name = req.query.name;
    const operation = await getOperation(name);
    return res.send(operation);
});

export default app;