import AdminFirestoreService, { FieldValue } from "@admin/services/AdminFirestoreService";
import DataExport from "@shared/models/DataExport";
import { CactusConfig } from "@shared/CactusConfig";
import { Collection } from "@shared/FirestoreBaseModels";

let firestoreService: AdminFirestoreService;

export default class AdminDataExportService {
    protected static sharedInstance: AdminDataExportService;
    config: CactusConfig;

    static getSharedInstance(): AdminDataExportService {
        if (!AdminDataExportService.sharedInstance) {
            throw new Error("No shared instance available. Ensure you initialize AdminDataExportService before using it");
        }
        return AdminDataExportService.sharedInstance;
    }

    static initialize(config: CactusConfig) {
        firestoreService = AdminFirestoreService.getSharedInstance();
        AdminDataExportService.sharedInstance = new AdminDataExportService(config);
    }

    constructor(config: CactusConfig) {
        this.config = config;
    }

    getCollectionRef() {
        return AdminFirestoreService.getSharedInstance().getCollectionRef(Collection.dataExports);
    }

    async save(model: DataExport): Promise<DataExport> {
        return firestoreService.save(model);
    }

    async getById(id: string): Promise<DataExport | undefined> {
        return await firestoreService.getById(id, DataExport);
    }

    async logDownload(id: string): Promise<void> {
        const docRef = this.getCollectionRef().doc(id);
        await docRef.update({ [DataExport.Fields.downloadCount]: FieldValue.increment(1) })
    }
}