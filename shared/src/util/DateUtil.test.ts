import {
    differenceInMinutes,
    formatDuration,
    getMailchimpDateString,
    makeUTCDateIntoMailchimpDate
} from "@shared/util/DateUtil";
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
        date.setHours(0, 0, 0, 0);


        const converted = makeUTCDateIntoMailchimpDate(date, true, "Europe/Paris");
        //2019-06-19T06:00:00.000+02:00
        expect(converted).toContain(`00:00:00.000+02:00`);
    });

    test("don't keep time", () => {
        const denverTime = 1560924000000; //at midnight
        const date = new Date(denverTime);
        const converted = makeUTCDateIntoMailchimpDate(date, false, "Europe/Paris");

        expect(converted).toContain("08:00:00.000+02:00");
    })

});

test("date formatting", () => {
    const dateMs = 1560924000000; //2019-06-19 at midnight in denver
    const date = new Date(dateMs);
    //set the house so that it's midnight in whatever timezone is running this test.
    date.setHours(0, 0, 0, 0);
    const format = DateTime.fromISO(date.toISOString()).toFormat("cccc yyyy-LL-dd 'at' h:mm a");
    expect(format).not.toBeNull();
    expect(format).toEqual("Wednesday 2019-06-19 at 12:00 AM")
});

test("date formatting 2", () => {
    // const denverTime = 1560924000000; //2019-06-19 at midnight
    // const date = new Date(denverTime);

    const suppressionDateISO = DateTime.fromISO("2019-02-21").minus({days: 10}).toISODate();
    expect(suppressionDateISO).toEqual("2019-02-11");
});

describe("format duration", () => {
    test("second scale formatting", () => {
        const denverTime = 1560924000000; //2019-06-19 at midnight
        const start = new Date(denverTime);
        const end = new Date(denverTime + 1200);
        expect(formatDuration(start, end)).toEqual("1.2s")
    });

    test("minute scale formatting", () => {
        const denverTime = 1560924000000; //2019-06-19 at midnight
        const start = new Date(denverTime);
        const end = new Date(denverTime + (1000 * 60 * 3 + 30000));
        expect(formatDuration(start, end)).toEqual("3m 30s")
    });
});


describe("get difference in minutes", () => {
    test("-5 minutes", () => {
        const start = 1560924000000;
        const end = start + (1000 * 5 * 60); //5 minutes;
        expect(differenceInMinutes(new Date(start), new Date(end))).toEqual(-5);
    });

    test("5 minutes", () => {
        const start = 1560924000000;
        const end = start - (1000 * 5 * 60); //5 minutes;
        expect(differenceInMinutes(new Date(start), new Date(end))).toEqual(5);
    })

    test("5.5 minutes", () => {
        const start = 1560924000000;
        const end = start - (1000 * 5.5 * 60); //5 minutes;
        expect(differenceInMinutes(new Date(start), new Date(end))).toEqual(5.5);
    })
});