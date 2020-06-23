import { FirebaseCommand } from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import { CactusConfig } from "@admin/CactusConfig";
import { Project } from "@scripts/config";
import { DeveloperNotification } from "@shared/api/GooglePlayBillingTypes";
import GooglePlayService from "@admin/services/GooglePlayService";
import { stringifyJSON } from "@shared/util/ObjectUtil";
import Logger from "@shared/Logger";
import GooglePlayBillingEventHandler from "@admin/pubsub/GooglePlayBillingEventHandler";
import { ChannelName } from "@admin/services/AdminSlackService";


const logger = new Logger("GooglePlayTest");
export default class GooglePlayTest extends FirebaseCommand {
    name = "Google Play Test";
    description = "";
    showInList = true;

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);

        const notif: DeveloperNotification = {
            "version": "1.0",
            "packageName": "app.cactus.stage",
            "eventTimeMillis": "1585086576620",
            "subscriptionNotification": {
                "version": "1.0",
                "notificationType": 2,
                "purchaseToken": "hfippbefkiindfnianobppip.AO-J1Ozk-1fIBbOQOYpvJK3pqXzdp0cGShtw5vZCGfbkcBNipWABGV4dah7OEoiK-a0QOSno_Rnx9YHFkn1iv-71BwBXtCOJSm8s8kSE6VV0OE2KSJzs07G5G5YDMMU7BGXTUeJzNRaL",
                "subscriptionId": "v3_plus_monthly_499"
            }
        };


        const purchase = await GooglePlayService.getSharedInstance().getPurchaseFromNotification(notif);

        const job = new GooglePlayBillingEventHandler(notif);
        job.slackChannel = ChannelName.engineering;
        await job.process();

        logger.info("Purchase", stringifyJSON(purchase));
        return;
    }

}
