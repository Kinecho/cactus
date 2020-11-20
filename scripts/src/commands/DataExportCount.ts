import { FirebaseCommand } from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import { CactusConfig } from "@admin/CactusConfig";
import { Project } from "@scripts/config";
import AdminDataExportService from "@admin/services/AdminDataExportService";
import DataExport from "@shared/models/DataExport";

export default class DataExportCount extends FirebaseCommand {
    name = "Data Export Count";
    description = "";
    showInList = true;

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);

        const query = AdminDataExportService.getSharedInstance().getCollectionRef();
        let count = 0;
        await AdminFirestoreService.getSharedInstance().executeBatchedQuery({
            query,
            batchSize: 100,
            type: DataExport,
            includeDeleted: true,
            onData: async (exports, batchNumber) => {
                count += exports.length;
            }
        })

        console.log(`\nTotal Count: ${ count }`);

        return;
    }

}