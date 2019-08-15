import {CactusConfig} from "@shared/CactusConfig";

import * as admin from "firebase-admin";
import * as flamelink from "flamelink/app";
import 'flamelink/content'
import 'flamelink/storage'
import FlamelinkModel from "@shared/FlamelinkModel";

export default class AdminFlamelinkService {
    protected static sharedInstance: AdminFlamelinkService;

    firebaseApp: admin.app.App;
    flamelinkApp: flamelink.app.App;

    static getSharedInstance(): AdminFlamelinkService {
        if (!AdminFlamelinkService.sharedInstance) {
            throw new Error("No shared instance available. Ensure you initialize AdminFlamelinkService before using it");
        }
        return AdminFlamelinkService.sharedInstance;
    }

    static initialize(config: CactusConfig) {
        AdminFlamelinkService.sharedInstance = new AdminFlamelinkService(config);
    }

    constructor(config: CactusConfig) {

        const credential: admin.ServiceAccount = {
            clientEmail: config.flamelink.service_account.client_email,
            privateKey: config.flamelink.service_account.private_key,
            projectId: config.flamelink.service_account.project_id,
        };

        const firebaseConfig = {
            credential: admin.credential.cert(credential),
            databaseURL: '<your-database-url>',
            storageBucket: '<your-storage-bucket-code>' // required if you want to use any Storage Bucket functionality
        };

        this.firebaseApp = admin.initializeApp(firebaseConfig, "flamelink");

        this.flamelinkApp = flamelink({
            firebaseApp: this.firebaseApp // required
            // same options as above
        })
    }


    async getById<T extends FlamelinkModel>(id: string, Type: { new(): T }): Promise<T | undefined> {
        const type = new Type();
        const schema = type.schema;
        console.log(`Fetching ${id} from ${schema}`);

        return await this.flamelinkApp.content.get({entryId: id, schemaKey: schema})
    }
}