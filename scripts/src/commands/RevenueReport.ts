import { FirebaseCommand } from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import { CactusConfig } from "@shared/CactusConfig";
import { Project } from "@scripts/config";
import AppStoreConnectService from "@admin/services/AppStoreConnectService";
import Logger from "@shared/Logger";

export default class RevenueReport extends FirebaseCommand {
    name = "Revenue Report";
    description = "Get revenue info from various providers";
    showInList = true;
    logger = new Logger("RevenueReport");
    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);


        const headers = await AppStoreConnectService.getSharedInstance().getHeaders();
        this.logger.info("Headers", JSON.stringify(headers, null, 2));


        await AppStoreConnectService.getSharedInstance().getSalesReports();

        return;
    }

}