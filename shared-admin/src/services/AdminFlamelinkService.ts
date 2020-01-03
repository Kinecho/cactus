import {CactusConfig} from "@shared/CactusConfig";
import * as admin from "firebase-admin";
import * as flamelink from "flamelink/app";
import 'flamelink/content'
import 'flamelink/storage'
import 'flamelink/settings'
import FlamelinkModel from "@shared/FlamelinkModel";
import {fromFlamelinkData} from "@shared/util/FlamelinkUtils";
import {convertDateToTimestamp} from "@shared/util/FirestoreUtil";
import {Collection} from "@shared/FirestoreBaseModels";

export default class AdminFlamelinkService {
    protected static sharedInstance: AdminFlamelinkService;
    flamelinkEnv: string;
    firebaseApp: admin.app.App;
    firestore: admin.firestore.Firestore;
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

        this.firebaseApp = app;
        this.firestore = app.firestore();
        this.flamelinkEnv = config.flamelink.environment_id;

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

    async updateRaw<T extends FlamelinkModel>(model?: T, options?: { updatedBy?: string }): Promise<T | undefined> {
        if (!model) {
            return;
        }
        const entryId = model.entryId;
        const schemaKey = model.schema;
        if (!entryId) {
            console.error("No entry ID found on model. Can not perform a raw update");
            return;
        }
        const data = model.toFlamelinkData();
        await this.firestore.runTransaction(async t => {
            const locale = await this.flamelinkApp.settings.getLocale();
            const query = this.firestore.collection(Collection.flamelink_content)
                .where('_fl_meta_.env', "==", this.flamelinkEnv)
                .where('_fl_meta_.locale', '==', locale)
                .where('_fl_meta_.fl_id', "==", entryId)
                .where('_fl_meta_.schema', '==', schemaKey);

            const snapshot = await t.get(query);
            const [entryDoc] = snapshot.docs;
            if (!entryDoc) {
                console.error(`Unable to perform RawUpdate on flamelink model. No entry found for ${schemaKey} ${entryId}`);
                return;
            }

            const ref = entryDoc.ref;
            const payload = {...data};
            if (options?.updatedBy) {
                payload['_fl_meta_.lastModifiedBy'] = options.updatedBy;
            }

            await t.update(ref, payload);
            return
        });

        return model;

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
            // console.log(chalk.magenta(`AdminFlamelinkService.ts: setting fl_meta on saved model ${JSON.stringify(saved, null, 2)}`));
            model.updateFromData(saved);
        }


        return model;
    }

    async getByEntryId<T extends FlamelinkModel>(id: string, Type: { new(): T }): Promise<T | undefined> {
        const type = new Type();
        const schema = type.schema;
        console.log(`Fetching ${id} from ${schema}`);

        const content = await this.flamelinkApp.content.get({entryId: id, schemaKey: schema});
        if (!content) {
            return undefined;
        }

        return fromFlamelinkData(content, Type);
    }

    async getByField<T extends FlamelinkModel>(opts: { name: string, value: any }, Type: { new(): T }): Promise<T | undefined> {

        const type = new Type();
        const schema = type.schema;
        console.log(`Fetching from ${schema} where ${opts.name} = ${opts.value}`);


        const results = await this.flamelinkApp.content.getByField({
            field: opts.name,
            value: opts.value,
            schemaKey: schema
        });

        if (!results) {
            return undefined
        }

        let content = results;

        const values = Object.values(results);
        if (Array.isArray(values)) {
            [content] = values;
        }

        if (!content) {
            return undefined
        }

        // console.log("content found in flamelink", JSON.stringify(content, null, 2))
        return fromFlamelinkData(content, Type);
    }

    //used to do a partial update
    async update<T extends FlamelinkModel>(model: T, data: Partial<T>): Promise<void> {
        // const type = new Type();
        const schema = model.schema;
        const entryId = model.entryId;
        if (!entryId) {
            console.warn("No entry id found on model", model);
            return
        }
        await this.flamelinkApp.content.update({
            schemaKey: schema,
            entryId: entryId,
            data: convertDateToTimestamp(data),
        })
    }

    async getAll<T extends FlamelinkModel>(Type: { new(): T }): Promise<{ results: T[], error?: any }> {
        const type = new Type();
        const schema = type.schema;
        console.log(`Fetching all from ${schema}`);
        try {
            const entries = await this.flamelinkApp.content.get({schemaKey: schema});
            if (!entries) {
                return {results: []};
            }

            const results = Object.values(entries).map(entry => {
                return fromFlamelinkData(entry, Type);
            });

            return {results};

        } catch (error) {
            console.error(`failed to get all ${schema} entries from flamelink`, error);
            return {results: [], error}

        }
    }

}