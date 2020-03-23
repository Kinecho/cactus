import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {CactusConfig} from "@shared/CactusConfig";
import {Project} from "@scripts/config";
import {DeveloperNotification} from "@shared/api/GooglePlayBillingTypes";
import GooglePlayService from "@admin/services/GooglePlayService";
import {stringifyJSON} from "@shared/util/ObjectUtil";
import Logger from "@shared/Logger";
import GooglePlayBillingEventHandler from "@admin/pubsub/GooglePlayBillingEventHandler";
import {ChannelName} from "@admin/services/AdminSlackService";


const logger = new Logger("GooglePlayTest");
export default class GooglePlayTest extends FirebaseCommand {
    name = "Google Play Test";
    description = "";
    showInList = true;

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);

        const notif: DeveloperNotification = {
            version: "1.0",
            packageName: "app.cactus.stage",
            eventTimeMillis: "1584483723896",
            subscriptionNotification: {
                version: "1.0",
                notificationType: 3,
                // "purchaseToken": "aacmccpmabajagnfahagbkmd.AO-J1Owi0peoORNtkgncRKNMRkpyNojGt55oxuKVtNvd6kSPpjnTZJq7WhxM_bMm5GfhpSdkMG6kOuIo2Cvqta4TpXWQA-6yEacNjs4RBz0ND29QrbWI9qOSS1HIJJIbTpbYDmMx1EVS",
                // purchaseToken: "dhomdbbcmiidefcgiafhkogk.AO-J1OyoKj7FTE_G_1b_chZiDRI5bmh-swIE8Yv21TTAlbfkHKJ7QVHFi2ptC4kSerFPWL0HijRZo02kpgJ5mr2uF_5QMPx40Q0x4FndHhEZAiIiPcfFKnk3hh1uxi_9SGoD7cjeXgVh",
                purchaseToken: "cdgefbpcealpllmcoiiflonl.AO-J1Ozx5gUMnrnLnE8hrt8W4LkZ2C8WIDvdw1qjPQIAROxA-AvDWJGKFn-obSY7MvORT-v_y5CshGf0WEDaH1x-pTK-jVLhAT4a2Dw3SgxADuzH9vEWIBKp1jMR4h-H1Qm4cghQIGub",
                subscriptionId: "cactus_plus_weekly_199"
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
