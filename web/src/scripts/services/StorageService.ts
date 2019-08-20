import {BaseModel} from "@shared/FirestoreBaseModels";
import {LocalStorageKey} from "@web/util";
import {fromJSON} from "@shared/util/FirestoreUtil";

export default class StorageService {
    static buildKey(prefix: LocalStorageKey, id: string): string {
        return `${prefix}_${id}`;
    }

    static getItem(key: LocalStorageKey): string | undefined {
        try {
            return localStorage.getItem(key) || undefined;
        } catch (error) {
            console.error(`Failed to get item ${key} from local storage`);
            return;
        }
    }

    static saveModel(key: LocalStorageKey, model: BaseModel, id?: string) {
        try {
            const encoded = this.getEncodedModelString(model);
            if (id) {
                const map = this.getEncodedMap(key);
                map[id] = encoded;
                localStorage.setItem(key, JSON.stringify(map))
            } else {
                localStorage.setItem(key, encoded);
            }

        } catch (error) {
            console.error("Failed to save to localstorage", error);
        }
    }

    static getEncodedModelString(model: BaseModel): string {
        return this.toBase64(model.toJSON());
    }

    private static getEncodedMap(key: LocalStorageKey): { [id: string]: string } {
        let mapString: string | undefined | null = localStorage.getItem(key);
        return mapString ? JSON.parse(mapString) : {};
    }

    static getModel<T extends BaseModel>(key: LocalStorageKey, Type: { new(): T }, id?: string): T | undefined {
        try {
            if (id) {
                const map = this.getEncodedMap(key);
                const encoded = map[id];
                return this.getModelFromEncodedString(encoded, Type);
            } else {
                const rawValue = localStorage.getItem(key);
                return this.getModelFromEncodedString(rawValue, Type);
            }

        } catch (error) {
            console.error("Failed to fetch model from localstorage", error);
        }
    }

    static getDecodeModelMap<T extends BaseModel>(key: LocalStorageKey, Type: { new(): T }): { [id: string]: T } {
        const encodedMap = this.getEncodedMap(key);
        const decodedMap: { [id: string]: T } = {};
        Object.keys(encodedMap).forEach(id => {
            const encoded = encodedMap[id];
            try {
                const model = this.getModelFromEncodedString(encoded, Type);
                if (model) {
                    decodedMap[id] = model;
                }
            } catch (error) {
                console.error(`StorageService: ${key}: Decoding error for modelId ${id} `)
            }
        });

        return decodedMap;
    }

    static getModelFromEncodedString<T extends BaseModel>(encoded: string | undefined | null, Type: { new(): T }): T | undefined {
        if (encoded) {
            const json = JSON.parse(this.fromBase64(encoded));
            return fromJSON(json, Type);
        }
    }

    static toBase64(object: any): string {
        return btoa(JSON.stringify(object));
    }

    static fromBase64(encoded: string): any {
        return atob(encoded);
    }

}