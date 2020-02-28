import {buildPromptURL, splitOnFirst, isGeneratedEmailAddress} from '@admin/util/StringUtil'
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import {resetTestConfig, setTestConfig} from "@admin/config/configService";

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
        const output = buildPromptURL(input);
        expect(output).toBeUndefined();
    });

    test("with content path prefixed with /", () => {

        setTestConfig({web: {domain: "mydomain.com", protocol: "https"}});

        const input = new ReflectionPrompt();
        input.contentPath = "/test";

        const output = buildPromptURL(input);
        expect(output).toEqual("https://mydomain.com/test")
    });

    test("with content path not prefixed with /", () => {
        setTestConfig({web: {domain: "mydomain.com", protocol: 'https'}});

        const input = new ReflectionPrompt();
        input.contentPath = "test/path";

        const output = buildPromptURL(input);
        expect(output).toEqual("https://mydomain.com/test/path")
    });

});


describe("check if email is fake / generated", () => {
    test("blank emailAddress", () => {
        const output = isGeneratedEmailAddress("");
        expect(output).toBe(false);
    });
    test("valid emailAddress", () => {
        const output = isGeneratedEmailAddress("scott@cactus.app");
        expect(output).toBe(false);
    });
    test("invalid emailAddress space in it", () => {
        const output = isGeneratedEmailAddress("scott @cactus.app");
        expect(output).toBe(false);
    });
    test("invalid emailAddress leading space", () => {
        const output = isGeneratedEmailAddress(" scott@cactus.app");
        expect(output).toBe(false);
    });
    test("invalid emailAddress leading space", () => {
        const output = isGeneratedEmailAddress(" scott@cactus.app");
        expect(output).toBe(false);
    });
    test("invalid emailAddress trailing space", () => {
        const output = isGeneratedEmailAddress("scott@cactus.app ");
        expect(output).toBe(false);
    });
    test("invalid emailAddress camel case", () => {
        const output = isGeneratedEmailAddress("ScOtTT@cacTus.app");
        expect(output).toBe(false);
    });
    test("fake emailAddress camel case", () => {
        const output = isGeneratedEmailAddress("scott@PRivate.Cactus.App");
        expect(output).toBe(true);
    });
    test("fake emailAddress", () => {
        const output = isGeneratedEmailAddress("scott@private.cactus.app");
        expect(output).toBe(true);
    });

});