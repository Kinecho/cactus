import {CactusConfig} from "@shared/CactusConfig";

import * as admin from "firebase-admin";
import * as flamelink from "flamelink/app";
import 'flamelink/content'
import 'flamelink/storage'
import FlamelinkModel from "@shared/FlamelinkModel";
import {fromFlamelinkData} from "@shared/util/FlamelinkUtils";

export default class AdminFlamelinkService {
    protected static sharedInstance: AdminFlamelinkService;

    // firebaseApp: admin.app.App;
    flamelinkApp: flamelink.app.App;
    content: flamelink.content.Content;

    static getSharedInstance(): AdminFlamelinkService {
        if (!AdminFlamelinkService.sharedInstance) {
            throw new Error("No shared instance available. Ensure you initialize AdminFlamelinkService before using it");
        }
        return AdminFlamelinkService.sharedInstance;
    }

    static initialize(config: CactusConfig, app: admin.app.App) {
        AdminFlamelinkService.sharedInstance = new AdminFlamelinkService(config, app);
    }

    constructor(config: CactusConfig, app: admin.app.App) {
        console.log("setting up flamelink service");
        // const credential: admin.ServiceAccount = {
        //     clientEmail: config.flamelink.service_account.client_email,
        //     privateKey: config.flamelink.service_account.private_key,
        //     projectId: config.flamelink.service_account.project_id,
        // };
        //
        // const firebaseConfig = {
        //     credential: admin.credential.cert(credential),
        //     databaseURL: '<your-database-url>',
        //     storageBucket: '<your-storage-bucket-code>' // required if you want to use any Storage Bucket functionality
        // };

        console.log("initializing firebase app for flamelink");
        // this.firebaseApp = admin.initializeApp(firebaseConfig, "flamelink");
        // this.firebaseApp = admin.initializeApp();


        console.log("starting flamelink app");
        this.flamelinkApp = flamelink({
            firebaseApp: app, // required
            // same options as above
            env: config.flamelink.environment_id,
            dbType: "cf",
            precache: false// optional, default shown. Currently it only precaches "schemas" for better performance

        });

        console.log("got flamelink app!");

        this.content = this.flamelinkApp.content;
    }

    async save<T extends FlamelinkModel>(model?: T): Promise<T | undefined> {
        if (!model) {
            return;
        }

        const data = model.toFlamelinkData();
        let saved: any;
        if (!model.entryId) {
            console.log("Adding new Flamelink content");
            saved = await this.content.add({
                schemaKey: model.schema,
                data: data,
            })
        } else {
            console.log("Updating Flamelink content");
            saved = await this.content.update({
                entryId: model.entryId,
                schemaKey: model.schema,
                data: data,
            });
        }

        if (saved) {
            console.log("setting fl_meta on saved model", JSON.stringify(saved, null, 2));
            model.updateFromData(saved);
        }


        return model;
    }

    async getById<T extends FlamelinkModel>(id: string, Type: { new(): T }): Promise<T | undefined> {
        const type = new Type();
        const schema = type.schema;
        console.log(`Fetching ${id} from ${schema}`);

        const content = await this.flamelinkApp.content.get({entryId: id, schemaKey: schema});
        if (!content) {
            return undefined;
        }

        return fromFlamelinkData(content, Type);
    }


}