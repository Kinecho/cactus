import PromptContent, { Content, ContentType, Image, isImage } from "@shared/models/PromptContent";
import { fromFlamelinkData } from "@shared/util/FlamelinkUtils";
import CactusMember from "@shared/models/CactusMember";
import { CoreValue } from "@shared/models/CoreValueTypes";
import { isBlank } from "@shared/util/StringUtil";

describe("serialize and deserialize send date", () => {
    test("serialize 2020-01-10T12:00:00-07:00", () => {
        const isoDate = "2020-01-10T12:00:00-07:00";
        const promptContent = new PromptContent();
        promptContent.scheduledSendAt = new Date(isoDate);
        const data = promptContent.toFlamelinkData();
        expect(data.scheduledSendAt).toEqual(isoDate);
    });

    test("deserialize 2020-01-10T12:00:00-07:00", () => {
        const isoDate = "2020-01-10T12:00:00-07:00";
        const data = { scheduledSendAt: isoDate };
        const promptContent = fromFlamelinkData(data, PromptContent);
        expect(promptContent.scheduledSendAt).toEqual(new Date(isoDate));


        // const promptContent = new PromptContent();
        // promptContent.scheduledSendAt = new Date(isoDate);

        // expect(data.scheduledSendAt).toEqual(isoDate);
    })
});

describe("Get dynamic content", () => {
    test("member has core values, prompt content has core values", () => {
        const member = new CactusMember();
        member.coreValues = [CoreValue.Achievement, CoreValue.Calm, CoreValue.Beauty];

        const content: Content = {
            text: "Plain Text",
            text_md: "Markdown Text",
            contentType: ContentType.text,
            coreValues: {
                valueReplaceToken: "{{CUSTOM_TOKEN}}",
                textTemplateMd: "This is a custom {{CUSTOM_TOKEN}} markdown string with a core value."
            }
        }

        const prompt = new PromptContent();
        prompt.preferredCoreValueIndex = 1;
        prompt.content = [content];

        //use specific core values index
        expect(prompt.getDynamicDisplayText({
            member,
            content,
            coreValue: undefined
        })).toEqual("This is a custom Calm markdown string with a core value.");

        prompt.preferredCoreValueIndex = undefined;

        //use default core value index
        expect(prompt.getDynamicDisplayText({
            member,
            content,
            coreValue: undefined
        })).toEqual("This is a custom Achievement markdown string with a core value.");

        //use overridden core value
        expect(prompt.getDynamicDisplayText({
            member,
            content,
            coreValue: CoreValue.Creativity
        })).toEqual("This is a custom Creativity markdown string with a core value.");


        //use out of range core value index
        prompt.preferredCoreValueIndex = 3
        expect(prompt.getDynamicDisplayText({
            member,
            content,
        })).toEqual("This is a custom Achievement markdown string with a core value.");

        //no values on the member
        member.coreValues = undefined;
        prompt.preferredCoreValueIndex = 99
        expect(prompt.getDynamicDisplayText({
            member,
            content,
        })).toEqual("Markdown Text");

        //with markdown
        expect(prompt.getDynamicDisplayText({
            member,
            content: {
                contentType: ContentType.text,
                text: "Plain Text",
                text_md: "Markdown Text",
            },
        })).toEqual("Markdown Text");

        //blank markdown
        expect(prompt.getDynamicDisplayText({
            member,
            content: {
                contentType: ContentType.text,
                text: "Plain Text",
                text_md: "  ",
            },
        })).toEqual("Plain Text");

        //no markdown
        expect(prompt.getDynamicDisplayText({
            member,
            content: {
                contentType: ContentType.text,
                text: "Plain Text",
            },
        })).toEqual("Plain Text");
    })
})

describe("get question", () => {
    test("no content", () => {
        const prompt = new PromptContent();
        prompt.content = [];

        expect(prompt.getQuestion()).toBeUndefined();
        expect(isBlank(prompt.getQuestion())).toBeTruthy();
    });

    test("no reflect content", () => {
        const prompt = new PromptContent();
        prompt.content = [{
            contentType: ContentType.text,
            text: "Text 1",
            text_md: "Text Markdown",
        }];

        expect(prompt.getQuestion()).toBeUndefined();
        expect(isBlank(prompt.getQuestion())).toBeTruthy();
    });

    test("reflect content with markdown and plain text ", () => {
        const prompt = new PromptContent();
        prompt.content = [
            {
                contentType: ContentType.text,
                text: "Text 1",
                text_md: "Text Markdown",
            },
            {
                contentType: ContentType.reflect,
                text: "Question Text",
                text_md: "Question Markdown",
            }];

        expect(prompt.getQuestion()).not.toBeUndefined();
        expect(isBlank(prompt.getQuestion())).toBeFalsy();
        expect(prompt.getQuestion()).toEqual("Question Markdown");
    });

    test("reflect content only plain text ", () => {
        const prompt = new PromptContent();
        prompt.content = [
            {
                contentType: ContentType.text,
                text: "Text 1",
                text_md: "Text Markdown",
            },
            {
                contentType: ContentType.reflect,
                text: "Question Text",
            }];

        expect(prompt.getQuestion()).not.toBeUndefined();
        expect(isBlank(prompt.getQuestion())).toBeFalsy();
        expect(prompt.getQuestion()).toEqual("Question Text");
    });

    test("reflect content blank markdown, has plain text ", () => {
        const prompt = new PromptContent();
        prompt.content = [
            {
                contentType: ContentType.text,
                text: "Text 1",
                text_md: "Text Markdown",
            },
            {
                contentType: ContentType.reflect,
                text_md: " ",
                text: "Question Text",
            }];

        expect(prompt.getQuestion()).not.toBeUndefined();
        expect(isBlank(prompt.getQuestion())).toBeFalsy();
        expect(prompt.getQuestion()).toEqual("Question Text");
    });

    test("from flamelink data - reflect with plain text", () => {
        const data = {
            content: [
                {
                    contentType: ContentType.text,
                    text: "Text 1",
                    text_md: "Text Markdown",
                },
                {
                    contentType: ContentType.reflect,
                    text: "Question Text",
                }]
        };
        const prompt = fromFlamelinkData(data, PromptContent);

        expect(prompt.getQuestion()).not.toBeUndefined();
        expect(isBlank(prompt.getQuestion())).toBeFalsy();
        expect(prompt.getQuestion()).toEqual("Question Text");
    });
})

describe("isImage typeguard", () => {
    test("null is false", () => {
        expect(isImage(null)).toBeFalsy();
    })

    test("undefined is false", () => {
        expect(isImage(undefined)).toBeFalsy();
    })

    test("empty object is false", () => {
        expect(isImage({})).toBeFalsy();
    })


    test("blank url is false", () => {
        expect(isImage({ url: "" })).toBeFalsy();
    })

    test("undefined url is false", () => {
        expect(isImage({ url: undefined } as Image)).toBeFalsy();
    })

    test("with a valid url is true", () => {
        const image: Image = {
            url: "https://cactus.app/image.png",
        }
        expect(isImage(image)).toBeTruthy();
    })
})