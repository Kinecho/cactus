import * as express from "express";
import * as cors from "cors";
import {backupFirestore} from "@api/endpoints/DataExportJob";

const app = express();
app.use(cors({origin: true}));
app.get('/', (req, res) => {
    res.status(200).json({status: 'ok', queryParams: req.query});
});

app.get("/backups", async (req, res) => {
    await backupFirestore(undefined,undefined);
    res.send("done");
});

export default app;