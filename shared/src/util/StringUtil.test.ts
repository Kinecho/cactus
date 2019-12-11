import {
    appendDomain,
    appendQueryParams,
    destructureDisplayName,
    getCharacterCount,
    getFilenameFromInput,
    getIntegerFromStringBetween,
    getPromptQuestion,
    getUrlFromInput,
    getWordCount,
    isBlank, preventOrphanedWords,
    stripQueryParams
} from "@shared/util/StringUtil";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import ReflectionResponse from "@shared/models/ReflectionResponse";
import PromptContent, {ContentType} from "@shared/models/PromptContent";

describe("get filename from input", () => {
    test("all lowercase, valid", () => {
        const input = "hello";
        expect(getFilenameFromInput(input, "html")).toEqual("hello.html");
    });

    test("Removes whitespaces & replaces with underscore", () => {
        const input = "Hello  There Page ";
        expect(getFilenameFromInput(input, "html")).toEqual("hello_there_page.html");
    });

    test("with other random characters", () => {
        const input = "The dos/dont's of $@!**${}[]|,, racing ";
        expect(getFilenameFromInput(input)).toEqual("the_dos_donts_of_racing");
    });
});


describe("get url from input", () => {
    test("My Awesome Page! With Questions", () => {
        const input = 'My Awesome Page! With Questions';
        expect(getUrlFromInput(input)).toEqual("/my-awesome-page-with-questions")
    });

    test("all lowercase, valid", () => {
        const input = "hello";
        expect(getUrlFromInput(input)).toEqual("/hello");
    });

    test("Removes whitespaces & replaces with hyphen", () => {
        const input = "Hello  There Page ";
        expect(getUrlFromInput(input)).toEqual("/hello-there-page");
    });

    test("Removes underscores", () => {
        const input = "Hello _ There Page ";
        expect(getUrlFromInput(input)).toEqual("/hello-there-page");
    });

    test("Special characters", () => {
        const input = "Hello _ There's my Page! ";
        expect(getUrlFromInput(input)).toEqual("/hello-theres-my-page");
    });

    test("with a forward slash", () => {
        const input = "The dos/dont's of racing ";
        expect(getUrlFromInput(input)).toEqual("/the-dos-donts-of-racing");
    });

    test("with a back slash", () => {
        const input = "The dos\\dont's of racing ";
        expect(getUrlFromInput(input)).toEqual("/the-dos-donts-of-racing");
    });

    test("with other random characters", () => {
        const input = "The dos/dont's of $@!**${}[]|,, racing ";
        expect(getUrlFromInput(input)).toEqual("/the-dos-donts-of-racing");
    });

    test("with other random characters", () => {
        const input = "The dos/dont's of $@!**${}[]|,, racing ";
        expect(getUrlFromInput(input)).toEqual("/the-dos-donts-of-racing");
    });

    test("with other random characters", () => {
        const input = "henrys_page_is_awesome";
        expect(getUrlFromInput(input)).toEqual("/henrys-page-is-awesome");
    });

    test("null value", () => {
        expect(getUrlFromInput(null)).toEqual("");
    });

    test("add a domain", () => {
        const input = "test_page";
        const domain = "cactus.app";
        expect(getUrlFromInput(input, domain)).toEqual("https://cactus.app/test-page");
    });

    test("get a localhost domain", () => {
        const input = "test_page";
        const domain = "localhost:8080";
        expect(getUrlFromInput(input, domain)).toEqual("http://localhost:8080/test-page");
    });
});

describe("Destructure displayName", () => {
    test("null value", () => {
        const input = null;
        const output = destructureDisplayName(input);
        expect(output).toEqual({});
    });

    test("Neil Poulin", () => {
        const input = "Neil Poulin";
        const output = destructureDisplayName(input);
        expect(output).toEqual({firstName: "Neil", lastName: "Poulin"});
    });

    test("Neil   Poulin lots of spaces", () => {
        const input = "  Neil   Poulin   ";
        const output = destructureDisplayName(input);
        expect(output).toEqual({firstName: "Neil", lastName: "Poulin"});
    });

    test("Neil James Poulin lots of spaces", () => {
        const input = "  Neil  James   Poulin   ";
        const output = destructureDisplayName(input);
        expect(output).toEqual({firstName: "Neil", middleName: "James", lastName: "Poulin"});
    });

    test("Neil King James Poulin lots of spaces", () => {
        const input = "  Neil  King James   Poulin   ";
        const output = destructureDisplayName(input);
        expect(output).toEqual({firstName: "Neil", lastName: "Poulin"});
    });
});

describe("Parse query string from url", () => {
    test("plain path", () => {
        const input = "/test";
        expect(stripQueryParams(input)).toEqual({url: "/test", query: {}});
    });

    test("single param", () => {
        const input = "/test?one=1";
        expect(stripQueryParams(input)).toEqual({url: "/test", query: {one: "1"}});
    });

    test("multiple params", () => {
        const input = "/test?one=1&url=test.com";
        expect(stripQueryParams(input)).toEqual({url: "/test", query: {one: "1", url: "test.com"}});
    });
});

describe("appendDomain", () => {
    test("no query params, with localhost", () => {
        const path = "/test";
        const domain = "localhost:8080";
        expect(appendDomain(path, domain)).toEqual("http://localhost:8080/test");
    });
    test("no query params, with localhost", () => {
        const path = "/test?key=value";
        const domain = "localhost:8080";
        expect(appendDomain(path, domain)).toEqual("http://localhost:8080/test?key=value");
    });
    test("no query params, with localhost", () => {
        const path = "/test?key=value";
        const domain = "cactus.app";
        expect(appendDomain(path, domain)).toEqual("https://cactus.app/test?key=value");
    });
})

describe("Combine query strings", () => {
    test("url with no params", () => {
        const url = "/test";
        const params = {test: "value"};

        expect(appendQueryParams(url, params)).toEqual("/test?test=value")
    });
    test("url with one params", () => {
        const url = "/test?my=code";
        const params = {test: "value"};

        expect(appendQueryParams(url, params)).toEqual("/test?my=code&test=value")
    });

    test("url with multiple params", () => {
        const url = "/test?my=code&foo=bar";
        const params = {test: "value", other: "stuff"};

        expect(appendQueryParams(url, params)).toEqual("/test?foo=bar&my=code&other=stuff&test=value")
    });

    test("url with with params but no additional params", () => {
        const url = "/test?my=code&foo=bar";
        const params = {};

        expect(appendQueryParams(url, params)).toEqual("/test?my=code&foo=bar")
    });
});

describe("get word count", () => {
    test("undefined", () => {
        const input = undefined;
        expect(getWordCount(input)).toEqual(0);
    });

    test("empty string", () => {
        const input = "";
        expect(getWordCount(input)).toEqual(0);
    });

    test("only whitespace string", () => {
        const input = "   ";
        expect(getWordCount(input)).toEqual(0);
    });

    test("one word", () => {
        const input = "hello";
        expect(getWordCount(input)).toEqual(1);
    });

    test("three words with extra space", () => {
        const input = "hello    what's up";
        expect(getWordCount(input)).toEqual(3);
    });
});

describe("get character count", () => {
    test("empty string", () => {
        const input = "";
        expect(getCharacterCount(input)).toEqual(0);
    });

    test("undefined", () => {
        const input = undefined;
        expect(getCharacterCount(input)).toEqual(0);
    });

    test("5 characters", () => {
        const input = "12345";
        expect(getCharacterCount(input)).toEqual(5);
    });

    test("with spaces", () => {
        const input = "12 45";
        expect(getCharacterCount(input)).toEqual(5);
    });

    test("padded string", () => {
        const input = "    12345  ";
        expect(getCharacterCount(input)).toEqual(5);
    });
});

describe("get number from string", () => {
    test("various strings", () => {
        expect(getIntegerFromStringBetween("abc", 5)).toEqual(4);
        expect(getIntegerFromStringBetween("abc124", 5)).toEqual(1);
        expect(getIntegerFromStringBetween("aaaa", 5)).toEqual(3);
        expect(getIntegerFromStringBetween("a", 5)).toEqual(2);
        expect(getIntegerFromStringBetween("b", 5)).toEqual(3);
        expect(getIntegerFromStringBetween("c", 5)).toEqual(4);
        expect(getIntegerFromStringBetween("d", 5)).toEqual(0);
        expect(getIntegerFromStringBetween("239aljadlkj291", 5)).toEqual(3);
        expect(getIntegerFromStringBetween("", 5)).toEqual(0);
    });
});

test("isBlank", () => {
    expect(isBlank("")).toBeTruthy();
    expect(isBlank("    ")).toBeTruthy();
    expect(isBlank(null)).toBeTruthy();
    expect(isBlank(undefined)).toBeTruthy();
    expect(isBlank("n")).toBeFalsy();
    expect(isBlank("  akdljafs ")).toBeFalsy();
});

describe("Get question text", () => {
    test("only prompt", () => {
        const prompt = new ReflectionPrompt();
        prompt.question = "test question";
        expect(getPromptQuestion({prompt})).toEqual("test question");
    });

    test("only prompt - trims spaces", () => {
        const prompt = new ReflectionPrompt();
        prompt.question = "  test question  ";
        expect(getPromptQuestion({prompt})).toEqual("test question");
    });

    test("prompt & response", () => {
        const response = new ReflectionResponse();
        response.promptQuestion = "response question";

        const prompt = new ReflectionPrompt();
        prompt.question = "test question";
        expect(getPromptQuestion({prompt, response})).toEqual("test question");
    });

    test("prompt & response & content", () => {
        const response = new ReflectionResponse();
        response.promptQuestion = "response question";

        const promptContent = new PromptContent();
        promptContent.content = [{contentType: ContentType.reflect, text: "Content Question"}];

        const prompt = new ReflectionPrompt();
        prompt.question = "test question";
        expect(getPromptQuestion({prompt, response, promptContent})).toEqual("Content Question");
    });


    test("no arguments", () => {
        expect(getPromptQuestion({})).toBeUndefined();
    });
});

describe("prevent orphaned words", () => {
    test("various input values", () => {
        expect(preventOrphanedWords("")).toEqual("");
        expect(preventOrphanedWords(undefined)).toBeUndefined();
        expect(preventOrphanedWords("hello")).toEqual("hello");
        expect(preventOrphanedWords("hello world")).toEqual("hello\xa0world");
        expect(preventOrphanedWords("hello world and people")).toEqual("hello world and\xa0people");
        expect(preventOrphanedWords("hello world and people")).not.toEqual("hello world and people");
        expect(preventOrphanedWords("hello world and people", "nbsp;")).toEqual("hello world andnbsp;people");
    })
})