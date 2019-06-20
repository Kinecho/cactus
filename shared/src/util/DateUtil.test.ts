import {getMailchimpDateString, makeUTCDateIntoMailchimpDate} from "@shared/util/DateUtil";

describe("getMailchimpCurrentDateString test", () => {
    test("no arguments returns a value", () => {
        const string = getMailchimpDateString();

        expect(string).not.toBeNull()
    });

    test("get for specific date", () => {
        //2019-06-01, denver
        const date = new Date(1559401591636);
        const string = getMailchimpDateString(date);

        expect(string).toEqual("2019-06-01")
    })
});

describe("convert timezones, keep time", () => {
    test("keep time", () => {
        const denverTime = 1560924000000; //at midnight
        const date = new Date(denverTime);

        const converted = makeUTCDateIntoMailchimpDate(date, true, "Europe/Paris");

        expect(converted).toContain("00:00:00.000+02:00");
    });

    test("don't keep time", () => {
        const denverTime = 1560924000000; //at midnight
        const date = new Date(denverTime);
        const converted = makeUTCDateIntoMailchimpDate(date, false, "Europe/Paris");

        expect(converted).toContain("08:00:00.000+02:00");
    })

});