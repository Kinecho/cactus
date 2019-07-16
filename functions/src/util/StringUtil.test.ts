import {buildPromptContentURL, splitOnFirst} from '@api/util/StringUtil'
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import {resetTestConfig, setTestConfig} from "@api/config/configService";

beforeEach(() => {
    resetTestConfig();
});

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

describe("get prompt content url", () => {
    test("no prompt", () => {
        const input = undefined;
        const output = buildPromptContentURL(input);
        expect(output).toBeUndefined();
    });

    test("with content path prefixed with /", () => {

        setTestConfig({web: {domain: "mydomain.com"}});

        const input = new ReflectionPrompt();
        input.contentPath = "/test";

        const output = buildPromptContentURL(input);
        expect(output).toEqual("https://mydomain.com/test")
    });

    test("with content path not prefixed with /", () => {
        setTestConfig({web: {domain: "mydomain.com"}});

        const input = new ReflectionPrompt();
        input.contentPath = "test/path";

        const output = buildPromptContentURL(input);
        expect(output).toEqual("https://mydomain.com/test/path")
    });

});