import {getFilenameFromInput, getUrlFromInput} from "@shared/util/StringUtil";

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
});