import { getFlamelink } from "@web/firebase";
import flamelink from "flamelink/app";
import FlamelinkModel from "@shared/FlamelinkModel";
import { buildQueryResult, fromFlamelinkData, fromFlamelinkQueryResults } from "@shared/util/FlamelinkUtils";
import { IGetOptions, QueryResult } from "@shared/types/FirestoreTypes";
import { ListenerUnsubscriber } from "@web/services/FirestoreService";
import Logger from "@shared/Logger";
import SubscriptionProduct from "@shared/models/SubscriptionProduct";

const logger = new Logger("FlamelinkService");

export interface PopulateOptions {
    field: string;
    subfields?: [PopulateOptions | string]
}

export interface EntryObserverOptions<IModel extends FlamelinkModel> extends IGetOptions {
    onData: (model?: IModel, error?: any) => void | Promise<void>,
    populate?: PopulateOptions
}

export type FlamelinkValue = string | number | boolean;

export abstract class FlamelinkModelService<T extends FlamelinkModel> {
    flamelink = FlamelinkService.sharedInstance;
    abstract Type: new () => T;

    async save(model?: T): Promise<T | undefined> {
        return this.flamelink.save(model);
    }

    async getByEntryId(entryId?: string): Promise<T | undefined> {
        if (!entryId) {
            return;
        }

        return this.flamelink.getById(entryId, this.Type)
    }

    observeByEntryId(id: string, options: EntryObserverOptions<T>): ListenerUnsubscriber {
        return this.flamelink.observeByEntryId(id, this.Type, options);
    }

    observeSingle(options: EntryObserverOptions<T>): ListenerUnsubscriber {
        return this.flamelink.observeSingle(this.Type, options);
    }

    async getFirstByField(args: { name: string, value: string }): Promise<T | undefined> {
        return this.flamelink.getFirstByField({ ...args, Type: this.Type });
    }

    async getAllWhere(args: { name: string, value: FlamelinkValue }): Promise<QueryResult<T>> {
        return this.flamelink.getAllWhere({ ...args, Type: this.Type });
    }

    observeByField(args: { name: string, value: string, Type: { new(): T } }, options: EntryObserverOptions<T>): ListenerUnsubscriber {
        return this.flamelink.observeByField({...args, Type: this.Type}, options);
    }
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
            logger.log("Adding new Flamelink content");
            saved = await this.content.add({
                schemaKey: model.schema,
                data: data,
            })
        } else {
            logger.log("Updating Flamelink content");
            saved = await this.content.update({
                entryId: model.entryId,
                schemaKey: model.schema,
                data: data,
            });
        }

        if (saved) {
            // logger.log("setting fl_meta on saved model", JSON.stringify(saved, null, 2));
            model.updateFromData(saved);
        }

        return model;
    }

    async getById<T extends FlamelinkModel>(id: string, Type: { new(): T }): Promise<T | undefined> {
        const type = new Type();
        const schema = type.schema;
        logger.log(`Fetching ${ id } from ${ schema }`);

        const content = await this.flamelink.content.get({ entryId: id, schemaKey: schema });
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
                    logger.error("Failed to load data from flamelink", error);
                    options.onData(undefined, error);
                    return;
                }
                if (!data) {
                    logger.log(`No entry found for ${ schema } ${ id }`);
                    options.onData(undefined, undefined);
                    return;
                }

                const model = fromFlamelinkData(data, Type);
                options.onData(model);
            }
        });
    }

    observeSingle<T extends FlamelinkModel>(Type: { new(): T }, options: EntryObserverOptions<T>): ListenerUnsubscriber {
        const type = new Type();
        const schema = type.schema;

        return this.content.subscribe({
            schemaKey: schema,
            populate: options.populate,
            callback: (error: any, data: { [id: string]: Partial<T> }) => {
                if (error) {
                    logger.error("Failed to load data from flamelink", error);
                    options.onData(undefined, error);
                    return;
                }
                if (!data) {
                    logger.log(`No data returned for schema ${ schema }`);
                    options.onData(undefined, undefined);
                    return;
                }

                // const [firstData] = Object.values(data);
                // if (!firstData) {
                //     logger.log(`No results for ${schema}`);
                //     options.onData(undefined, undefined);
                //     return;
                // }


                const model = fromFlamelinkData(data, Type);
                options.onData(model);
            }
        });
    }


    async getFirstByField<T extends FlamelinkModel>(args: { name: string, value: string, Type: { new(): T } }): Promise<T | undefined> {
        const { name, value, Type } = args;

        const type = new Type();
        const schema = type.schema;

        try {
            const data: { [entryId: string]: any } = await this.content.getByField({
                field: name,
                value,
                schemaKey: schema
            });
            let entry: any | undefined = undefined;
            if (data) {
                entry = Object.values(data).find(d => d[name] === value);
                return fromFlamelinkData(entry, Type);
            }
        } catch (error) {
            logger.error("Error fetching data from flamelink content", error);
        }
        return;
    }


    async getAllWhere<T extends FlamelinkModel>(args: { name: string, value: FlamelinkValue, Type: { new(): T } }): Promise<QueryResult<T>> {
        const { name, value, Type } = args;

        const type = new Type();
        const schema = type.schema;

        try {
            const raw: { [entryId: string]: any } = await this.content.getByField({
                field: name,
                value,
                schemaKey: schema
            });
            return buildQueryResult(raw, Type);
        } catch (error) {
            logger.error("Error fetching data from flamelink content", error);
            return { results: [], error: error, size: 0 }
        }

    }


    observeByField<T extends FlamelinkModel>(args: { name: string, value: string, Type: { new(): T } }, options: EntryObserverOptions<T>): ListenerUnsubscriber {
        const { name, value, Type } = args;

        const type = new Type();
        const schema = type.schema;

        return this.content.subscribe({
            schemaKey: schema,
            populate: options.populate,
            filters: [[name, "==", value]],
            callback: (error: any, data: { [entryId: string]: any }) => {
                let entry: any | undefined = undefined;
                if (data) {
                    entry = Object.values(data).find(d => d[name] === value);
                }


                if (error) {
                    logger.error("Failed to load data from flamelink", error);
                    options.onData(undefined, error);
                    return;
                }
                if (!entry) {
                    logger.log(`No entry found for ${ schema } where ${ name }=${ value }`);
                    options.onData(undefined, undefined);
                    return;
                }

                const model = fromFlamelinkData(entry, Type);
                options.onData(model);
            }
        });
    }

    async getAll<T extends FlamelinkModel>(Type: { new(): T }): Promise<QueryResult<T>> {
        try {
            const type = new Type();
            const schemaKey = type.schema;

            const raw = await this.content.get({ schemaKey });
            return buildQueryResult(raw, Type);
        } catch (error) {
            return { error, results: [], size: 0 }
        }
    }

    async getWhereFields<T extends FlamelinkModel>(fields: { name: string, value: any }[], Type: { new(): T }): Promise<T | undefined> {
        const type = new Type();
        const schema = type.schema;
        const filters = fields.map(({ name, value }) => {
            return [name, "==", value]
        });

        // logger.log(`Fetching from ${schema} where ${JSON.stringify(filters, null, 2)}`);

        const results = await this.flamelink.content.get({
            filters,
            schemaKey: schema
        });

        if (!results) {
            return undefined
        }

        let content = results;

        const values = Object.values(results);
        logger.info("Values fetched from get where fields = ", values);
        if (Array.isArray(values)) {
            [content] = values;
        }

        if (!content) {
            return undefined
        }

        // logger.log("content found in flamelink", JSON.stringify(content, null, 2))
        return fromFlamelinkData(content, Type);
    }
}