import PromptContent, { Content, ContentType } from "@shared/models/PromptContent";
import { fromFlamelinkData } from "@shared/util/FlamelinkUtils";
import CactusMember from "@shared/models/CactusMember";
import { CoreValue } from "@shared/models/CoreValueTypes";

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
        prompt.preferredCoreValueIndex = 99
        expect(prompt.getDynamicDisplayText({
            member,
            content,
        })).toEqual("This is a custom Beauty markdown string with a core value.");


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