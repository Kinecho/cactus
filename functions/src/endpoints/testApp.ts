import * as express from "express";
import * as cors from "cors";
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

export default app;