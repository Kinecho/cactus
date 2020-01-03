import PromptContent from "@shared/models/PromptContent";
import {fromFlamelinkData} from "@shared/util/FlamelinkUtils";

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
        const data = {scheduledSendAt: isoDate};
        const promptContent = fromFlamelinkData(data, PromptContent);
        expect(promptContent.scheduledSendAt).toEqual(new Date(isoDate));



        // const promptContent = new PromptContent();
        // promptContent.scheduledSendAt = new Date(isoDate);

        // expect(data.scheduledSendAt).toEqual(isoDate);
    })
});