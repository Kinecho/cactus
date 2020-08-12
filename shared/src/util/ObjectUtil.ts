import Logger from "@shared/Logger";

const logger = new Logger("ObjectUtil.ts");

export type RecursivePartial<T> = {
    [P in keyof T]?: RecursivePartial<T[P]>;
};

export function isError(input: any): input is Error {
    return input instanceof Error;
}

export function isNonEmptyObject(input: any): input is Object {
    if (isNull(input)) {
        return false;
    }
    return typeof (input) === "object" && !Array.isArray(input) && Object.keys(input).length > 0;
}

export function hasIdField(input: any): input is { id: any, [key: string]: any } {
    return isNonEmptyObject(input) && input.hasOwnProperty("id") && (input.id ?? false)
}

export function isArray(input: any) {
    if (isNull(input)) {
        return false;
    }
    return Array.isArray(input);
}

export function isBoolean(input: any): input is boolean {
    return input === true || input === false;
}

export function isNull(input: any): input is undefined | null {
    return input === null || input === undefined;
}

export function isNotNull(input: any): boolean {
    return !isNull(input);
}

export function optionalStringToNumber(input: string | undefined): number | undefined {
    if (isNull(input)) {
        return undefined;
    }

    const num = Number(input);
    if (isNumber(num)) {
        return num
    }
    return;
}

export function isDate(input: any): input is Date {
    return isNotNull(input) && input instanceof Date;
}

export function isString(input: any): input is string {
    try {
        return isNotNull(input) && typeof (input) === "string";
    } catch {
        return false;
    }
}

export function isNumber(input: any): input is number {
    try {
        const number = Number(input);
        return isNotNull(number) && typeof (input) === "number" && !isNaN(input);
    } catch (error) {
        return false;
    }
}

/**
 * Transform object keys based on provided async transform function
 * @param {any} input
 * @param {(value: any) => Promise<void>} transform
 * @return {Promise<any>}
 */
export async function transformObjectAsync(input: any, transform: (value: any) => Promise<any>): Promise<any> {
    if (isArray(input)) {
        const tasks = input.map((entry: any) => transformObjectAsync(entry, transform));
        return await Promise.all(tasks);
        // input.forEach(async (entry:any) => await transformObject(entry, transform))
    }

    // input = await (transform(input))
    const rootTransform = await transform(input);

    if (rootTransform !== input) {
        return rootTransform;
    }

    if (isNonEmptyObject(input)) {
        const tasks = Object.keys(input).map(async key => {
            let value = input[key];
            const transformed = await transform(value);

            //if the transformation did something, don't loop through the value
            if (value === transformed) {
                value = await transformObjectAsync(value, transform);
            } else {
                value = transformed;
            }

            if (value === undefined) {
                delete input[key]
            } else {
                input[key] = value;
            }
        });
        await Promise.all(tasks);
    }


    return input;
}

/**
 * Transform object keys based on provided transform function.
 * This will delete undefined keys in objects
 * @param {any} input
 * @param {(value: any) => Promise<void>} transform
 * @param {number} depth how deep the transform can go before exiting
 * @param {string} [forKey] the key that is being transformed currently. Mostly for logging purposes.
 * @return {any}
 */
export function transformObjectSync(input: any, transform: (value: any) => any, depth: number = 0, forKey?: string): any {
    if (depth >= 100) {
        logger.warn(`transformObjectSync method reached a depth greater than 10, Current depth = ${ depth }. Key = ${ forKey || "rootKey" } Returning witihout processing`);
        return input;
    }
    if (isArray(input)) {
        return input.map((entry: any) => transformObjectSync(entry, transform, depth + 1, forKey || "root-Array"));
    }

    // input = await (transform(input))
    const rootTransform = transform(input);

    if (rootTransform !== input) {
        return rootTransform;
    }

    if (isNonEmptyObject(input)) {
        Object.keys(input).forEach(key => {
            let value = input[key];

            //TODO: find a more robust way to detect if the value is a Firebase.DocumentRef (or other firebase object) and skip processing it.
            if (key === "_fl_meta_") {
                return value;
            }

            const transformed = transform(value);

            //if the transformation did something, don't loop through the value
            if (value === transformed && (isNonEmptyObject(value) || Array.isArray(value))) {
                value = transformObjectSync(value, transform, depth + 1, key);
            } else {
                value = transformed;
            }

            if (value === undefined) {
                delete input[key]
            } else {
                input[key] = value;
            }
        });

    }
    return input;
}

export function toPlainObject(input: any): any {
    if (!input) {
        return input;
    }
    return transformObjectSync(input, (value => {
        if (isNonEmptyObject(value)) {
            return Object.assign({}, value)
        }
        return value
    }))
}

export function stringifyJSON(input: any, space?: number): string {
    function replacer(key: string, value: any) {
        if (value && typeof value === "object") {
            if (value && value.toJSON) {
                try {
                    logger.log("Calling toJSON on object");
                    return value.toJSON()
                } catch (error) {
                    return value;
                }
            }
        }
        return value;
    }

    const copy = isNonEmptyObject(input) ? Object.assign({}, input) : input;
    return JSON.stringify(copy, replacer, space);
}

export function chunkArray<T>(list: T[], batchSize: number): (T[])[] {
    if (!list || list.length === 0) {
        return [];
    }

    if (batchSize < 1) {
        throw new Error("You must provide a batch size greater than 0");
    }

    return Array(Math.ceil(list.length / batchSize))
    .fill(0).map((_: any, index: number) => index * batchSize)
    .map(begin => list.slice(begin, begin + batchSize));
}