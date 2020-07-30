// tslint:disable-next-line:no-var-requires
require("module-alias/register");
import { getConfig } from "@admin/config/configService";
import { initializeServices } from "@admin/services/AdminServiceConfig";
import Logger from "@shared/Logger";
import { stringifyJSON } from "@shared/util/ObjectUtil";
import * as express from "express";
import * as admin from "firebase-admin";
const logger = new Logger("app");
const firebaseAdmin = admin.initializeApp();
const config = getConfig();
logger.info("Got config...", stringifyJSON(config));
initializeServices(config, firebaseAdmin, admin.firestore.Timestamp);

logger.info("Starting the app");
const PORT = Number(process.env.PORT) || 8080;
const app = express();
// app.use(Sentry.Handlers.requestHandler() as express.RequestHandler);

app.get("/", (req: express.Request, res: express.Response) => {
    res.send("🌵 Cactus will be deployed here.");
});

// When we have routes to register, this is how we'd do it.
// app.use("/users", userRoutes);

const server = app.listen(PORT, () => {
    console.log(`App listening on port ${ PORT }`);
});
// app.use(Sentry.Handlers.errorHandler() as express.ErrorRequestHandler);

export default server;
