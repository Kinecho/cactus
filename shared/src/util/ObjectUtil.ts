export function isNonEmptyObject(input: any): boolean {
    if (isNull(input)) {
        return false;
    }
    return typeof (input) === "object" && !Array.isArray(input) && Object.keys(input).length > 0;
}

export function isArray(input: any) {
    if (isNull(input)) {
        return false;
    }
    return Array.isArray(input);
}

export function isNull(input: any): boolean {
    return input === null || input === undefined;
}

export function isNotNull(input: any): boolean {
    return !isNull(input);
}

export function isDate(input: any) {
    return isNotNull(input) && input instanceof Date;
}

export function isNumber(input: any) {
    try {
        const number = Number(input);
        return isNotNull(number) && typeof (input) === "number";
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
 * @return {any}
 */
export function transformObjectSync(input: any, transform: (value: any) => any, depth: number = 0, forKey?: string): any {
    console.debug(`Transform objectSync called with recursion depth ${depth} ${forKey ? "For Key=" + forKey : ""}`);
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
                console.debug(`Recursive call to transformObjectSync for key = ${key}`);
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


export function stringifyJSON(input: any, space?: number): string {
    function replacer(key: string, value: any) {
        if (value && typeof value === "object") {
            if (value && value.toJSON) {
                try {
                    console.log("Calling toJSON on object");
                    return value.toJSON()
                } catch (error) {
                    return value;
                }
            }
        }
        return value;
    }

    return JSON.stringify(input, replacer, space);
}