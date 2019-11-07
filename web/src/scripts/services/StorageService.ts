import {BaseModel} from "@shared/FirestoreBaseModels";
import {fromJSON} from "@shared/util/FirestoreUtil";

export enum LocalStorageKey {
    emailForSignIn = 'emailForSignIn',
    emailAutoFill = 'emailAutoFill',
    newUserSignIn = "newUserSignIn",
    referredByEmail = "referredByEmail",
    anonReflectionResponse = "anonReflectionResponse",
    landingQueryParams = "landingQueryParams",
    flamelinkEnvironmentOverride = "flamelinkEnvironmentOverride",
    memberStatsEnabled = "memberStatsEnabled",
    contactsImportEnabled = "contactsImportEnabled"
}

export default class StorageService {

    static clear() {
        try {
            localStorage.clear();
        } catch (error) {
            console.error("StorageService Failed to clear storage", error)
        }
    }

    static removeItem(key: LocalStorageKey, id?: string) {
        if (id) {
            const map = this.getEncodedMap(key);
            delete map[id];
            console.log(`removed ${id} from `, map);
            this.saveJSON(key, map);
        } else {
            localStorage.removeItem(key);
        }
    }

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

    static saveBoolean(key: LocalStorageKey, value: boolean) {
        localStorage.setItem(key, `${value}`)
    }

    static getBoolean(key: LocalStorageKey, defaultValue: boolean = false): boolean {
        const storedValue = this.getItem(key);
        if (storedValue === undefined || storedValue === null || storedValue.trim() === "") {
            return defaultValue
        }

        return storedValue === "true" || false
    }

    static saveJSON(key: LocalStorageKey, object: any) {
        localStorage.setItem(key, JSON.stringify(object));
    }

    static getJSON(key: LocalStorageKey): { [name: string]: string } {
        return this.getEncodedMap(key);
    }

    static saveModel(key: LocalStorageKey, model: BaseModel, id?: string) {
        try {
            const encoded = this.getEncodedModelString(model);
            if (id) {
                const map = this.getEncodedMap(key);
                map[id] = encoded;
                this.saveJSON(key, map);
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
        const mapString: string | undefined | null = localStorage.getItem(key);
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