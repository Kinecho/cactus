import {splitOnFirst} from '@api/util/StringUtil'

describe("splitOnFirst tests", () => {
    test("colon string (headers)", () => {
        const input = "Content-Type: application/json";
        const delim = ":";
        const [key, value] = splitOnFirst(input, delim);
        expect(key).toEqual("Content-Type");
        expect(value).toEqual("application/json");
    });

    test("colon string (headers) - no trimming", () => {
        const input = "Content-Type: application/json";
        const delim = ":";
        const [key, value] = splitOnFirst(input, delim, false);
        expect(key).toEqual("Content-Type");
        expect(value).toEqual(" application/json");
    });

    test("empty string", () => {
        const input = "";
        const delim = ":";
        const [key, value] = splitOnFirst(input, delim, false);
        expect(key).toEqual(undefined);
        expect(value).toEqual(undefined);
    });


});