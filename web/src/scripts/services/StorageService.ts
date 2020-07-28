import { BaseModel } from "@shared/FirestoreBaseModels";
import { fromJSON } from "@shared/util/FirestoreUtil";
import Logger from "@shared/Logger";

export enum LocalStorageKey {
    emailForSignIn = 'emailForSignIn',
    emailAutoFill = 'emailAutoFill',
    newUserSignIn = "newUserSignIn",
    referredByEmail = "referredByEmail",
    anonReflectionResponse = "anonReflectionResponse",
    landingQueryParams = "landingQueryParams",
    flamelinkEnvironmentOverride = "flamelinkEnvironmentOverride",
    memberStatsEnabled = "memberStatsEnabled",
    contactsImportEnabled = "contactsImportEnabled",
    activityBadgeCount = "activityBadgeCount",
    offerDetails = "offerDetails",
    androidFCMToken = "androidFCMToken",
    subscriptionPriceCents = "subscriptionPriceCents",
    experiments = "experiments",
}

const logger = new Logger("StorageService.ts");

export default class StorageService {

    static clear() {
        try {
            localStorage.clear();
        } catch (error) {
            logger.error("StorageService Failed to clear storage", error)
        }
    }

    static removeItem(key: LocalStorageKey, id?: string) {
        if (id) {
            const map = this.getEncodedMap(key, {});
            delete map[id];
            logger.log(`removed ${ id } from `, map);
            this.saveJSON(key, map);
        } else {
            localStorage.removeItem(key);
        }
    }

    static buildKey(prefix: LocalStorageKey, id: string): string {
        return `${ prefix }_${ id }`;
    }

    static getItem(key: LocalStorageKey): string | undefined {
        try {
            return localStorage.getItem(key) || undefined;
        } catch (error) {
            logger.error(`Failed to get item ${ key } from local storage`);
            return;
        }
    }

    static saveBoolean(key: LocalStorageKey, value: boolean) {
        localStorage.setItem(key, `${ value }`)
    }

    static getBoolean(key: LocalStorageKey, defaultValue: boolean = false): boolean {
        const storedValue = this.getItem(key);
        if (storedValue === undefined || storedValue === null || storedValue.trim() === "") {
            return defaultValue
        }

        return storedValue === "true" || false
    }

    static saveNumber(key: LocalStorageKey, value: number) {
        localStorage.setItem(key, `${ value }`);
    }

    static saveString(key: LocalStorageKey, value: string) {
        localStorage.setItem(key, value);
    }

    static getString(key: LocalStorageKey): string | undefined {
        return localStorage.getItem(key) || undefined;
    }

    static getNumber(key: LocalStorageKey, defaultValue?: number): number | undefined {
        const storedValue = this.getItem(key);
        if (storedValue === undefined || storedValue === null || storedValue.trim() === "") {
            return defaultValue
        }

        try {
            const num = Number(storedValue);
            if (!isNaN(num)) {
                return num
            }
        } catch (error) {
            logger.error("An error occurred while parsing to number for value: ", storedValue)
        }
        return defaultValue
    }

    static saveJSON(key: LocalStorageKey, object: any) {
        localStorage.setItem(key, JSON.stringify(object));
    }

    static getJSON(key: LocalStorageKey, defaultValue: Record<string, string|null>): Record<string, string|null>;
    static getJSON(key: LocalStorageKey): Record<string, string|null>|null;
    static getJSON(key: LocalStorageKey, defaultValue: Record<string, string|null> | null = null): Record<string, string|null> | null {
        return this.getEncodedMap(key, defaultValue);
    }

    static saveModel(key: LocalStorageKey, model: BaseModel, id?: string) {
        try {
            const encoded = this.getEncodedModelString(model);
            if (id) {
                const map = this.getEncodedMap(key, {});
                map[id] = encoded;
                this.saveJSON(key, map);
            } else {
                localStorage.setItem(key, encoded);
            }

        } catch (error) {
            logger.error("Failed to save to localstorage", error);
        }
    }

    static getEncodedModelString(model: BaseModel): string {
        return this.toBase64(model.toJSON());
    }

    private static getEncodedMap<T extends Record<string, any> | null>(key: LocalStorageKey, defaultValue?: T): T extends Record<string, any> ? Record<string, any> : T {
        const mapString: string | undefined | null = localStorage.getItem(key);
        return mapString ? JSON.parse(mapString) : defaultValue ?? null;
    }

    static getModel<T extends BaseModel>(key: LocalStorageKey, Type: { new(): T }, id?: string): T | undefined {
        try {
            if (id) {
                const map = this.getEncodedMap(key);
                if (!map) {
                    return undefined;
                }
                const encoded = map[id];
                return this.getModelFromEncodedString(encoded, Type);
            } else {
                const rawValue = localStorage.getItem(key);
                return this.getModelFromEncodedString(rawValue, Type);
            }

        } catch (error) {
            logger.error("Failed to fetch model from localstorage", error);
        }
    }

    static getDecodeModelMap<T extends BaseModel>(key: LocalStorageKey, Type: { new(): T }): { [id: string]: T } {
        const encodedMap = this.getEncodedMap(key, {});
        const decodedMap: { [id: string]: T } = {};
        Object.keys(encodedMap).forEach(id => {
            const encoded = encodedMap[id];
            try {
                const model = this.getModelFromEncodedString(encoded, Type);
                if (model) {
                    decodedMap[id] = model;
                }
            } catch (error) {
                logger.error(`StorageService: ${ key }: Decoding error for modelId ${ id } `)
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