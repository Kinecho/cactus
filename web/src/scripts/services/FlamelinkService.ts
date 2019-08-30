import {getFlamelink} from "@web/firebase";
import flamelink from "flamelink/app";
import FlamelinkModel from "@shared/FlamelinkModel";
import {fromFlamelinkData} from "@shared/util/FlamelinkUtils";
import {GetOptions} from "@shared/types/FirestoreTypes";
import {ListenerUnsubscriber} from "@web/services/FirestoreService";

export interface PopulateOptions {
    field: string;
    subfields?: [PopulateOptions | string]
}

export interface EntryObserverOptions<IModel extends FlamelinkModel> extends GetOptions {
    onData: (model?: IModel, error?: any) => void | Promise<void>,
    populate?: PopulateOptions
}

export default class FlamelinkService {
    flamelink: flamelink.app.App;
    content: flamelink.content.Content;

    public static sharedInstance = new FlamelinkService();

    constructor() {
        this.flamelink = getFlamelink();
        this.content = this.flamelink.content;
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

        const content = await this.flamelink.content.get({entryId: id, schemaKey: schema});
        if (!content) {
            return undefined;
        }

        return fromFlamelinkData(content, Type);
    }

    observeByEntryId<T extends FlamelinkModel>(id: string, Type: { new(): T }, options: EntryObserverOptions<T>): ListenerUnsubscriber {
        const type = new Type();
        const schema = type.schema;

        return this.content.subscribe({
            entryId: id,
            schemaKey: schema,
            populate: options.populate,
            callback: (error: any, data: Partial<T>) => {
                if (error) {
                    console.error("Failed to load data from flamelink", error);
                    options.onData(undefined, error);
                    return;
                }
                if (!data) {
                    console.log(`No entry found for ${schema} ${id}`);
                    options.onData(undefined, undefined);
                    return;
                }

                const model = fromFlamelinkData(data, Type);
                options.onData(model);
            }
        });
    }
}