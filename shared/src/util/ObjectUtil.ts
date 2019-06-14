export function isNonEmptyObject(input:any):boolean{
    if (isNull(input)){
        return false;
    }
    return typeof (input) === "object" && !Array.isArray(input) && Object.keys(input).length > 0;
}

export function isArray(input:any){
    if (isNull(input)){
        return false;
    }
    return Array.isArray(input);
}

export function isNull(input:any):boolean {
 return input === null || input === undefined;
}

export function isNotNull(input:any):boolean{
    return !isNull(input);
}

export function isDate(input:any){
    return isNotNull(input) && input instanceof Date;
}

/**
 * Transform object keys based on provided transform function
 * @param {any} input
 * @param {(value: any) => Promise<void>} transform
 * @return {Promise<any>}
 */
export async function transformObject(input:any, transform:(value:any) => Promise<void>):Promise<any> {
    if (isArray(input)){
        let tasks = input.map((entry:any) => transformObject(entry, transform));
        return await Promise.all(tasks);
        // input.forEach(async (entry:any) => await transformObject(entry, transform))
    }

    // input = await (transform(input))
    const transformed = await transform(input);

    if (transformed !== input){
        return transformed;
    }

    if (isNonEmptyObject(input)) {
        let tasks = Object.keys(input).map(async key => {
            let value = input[key];
            const transformed = await transform(value);

            //if the transformation did something, don't loop through the value
            if (value === transformed){
                value = await transformObject(value, transform);
            } else {
                value = transformed;
            }

            input[key] = value;
        });
        await Promise.all(tasks);
    }


    return input;
}