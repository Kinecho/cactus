import {getMailchimpDateString, makeUTCDateIntoMailchimpDate} from "@shared/util/DateUtil";
import {DateTime} from "luxon";

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

test("date formatting", () => {
    const denverTime = 1560924000000; //2019-06-19 at midnight
    const date = new Date(denverTime);
    const format = DateTime.fromISO(date.toISOString()).toFormat("cccc yyyy-LL-dd 'at' h:mm a");
    expect(format).not.toBeNull();
    expect(format).toEqual("Wednesday 2019-06-19 at 12:00 AM")
});

test("date formatting 2" , () => {
    // const denverTime = 1560924000000; //2019-06-19 at midnight
    // const date = new Date(denverTime);

    const suppressionDateISO = DateTime.fromISO("2019-02-21").minus({days: 10}).toISODate();
    expect(suppressionDateISO).toEqual("2019-02-11");
});

