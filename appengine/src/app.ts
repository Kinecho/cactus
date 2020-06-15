// tslint:disable-next-line:no-var-requires
require("module-alias/register");
import slackRoutes from "@app/routes/slackRoutes";
import Logger from "@shared/Logger";
import * as express from "express";

const logger = new Logger("app");

logger.info("Starting the app");
const PORT = Number(process.env.PORT) || 8080;
const app = express();

app.get("/", (req: express.Request, res: express.Response) => {
    res.send("🌵 Cactus will be deployed here.");
});

app.use("/slack", slackRoutes);

const server = app.listen(PORT, () => {
    console.log(`App listening on port ${ PORT }`);
});

export default server;
