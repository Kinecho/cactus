import * as express from "express";
import * as cors from "cors";

const app = express();
app.use(cors({origin: true}));
app.get('/', (req, res) => {
    res.status(200).json({status: 'ok', queryParams: req.query});
});

export default app;