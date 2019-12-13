// Dates are serialized in TZ format, example: '1981-12-20T04:00:14.000Z'.
const datePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export function deserializeJson(payload: string) {
    try {
        return  JSON.parse(payload, jsonReviver);
    } catch (error) {
        console.error("Unable to parse JSON string", error);
    }
}

function jsonReviver(key:any, value: any) {
    if (isSerializedDate(value)) {
        return (new Date(value));
    }

    return (value);
}

// I determine if the given value is a string that matches the serialized-date pattern.
function isSerializedDate(value: any): boolean {
    return (isString(value) && datePattern.test(value));
}

function isString(value: any) {
    return ({}.toString.call(value) === "[object String]");
}