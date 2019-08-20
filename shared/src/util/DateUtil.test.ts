import {
    differenceInMinutes,
    formatDuration,
    formatDurationAsTime,
    getMailchimpDateString,
    getStreak,
    makeUTCDateIntoMailchimpDate,
    numDaysAgoFromMidnights
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

describe("format duration as time", () => {
    test("5 seconds", () => {
        const input = 5000;
        expect(formatDurationAsTime(input)).toEqual("00:05");
    });

    test("10 seconds", () => {
        const input = 10000;
        expect(formatDurationAsTime(input)).toEqual("00:10");
    });
    test("12 seconds", () => {
        const input = 12000;
        expect(formatDurationAsTime(input)).toEqual("00:12");
    });


    test("93 seconds", () => {
        const input = 93000;
        expect(formatDurationAsTime(input)).toEqual("01:33");
    });

    test("61 seconds", () => {
        const input = 61000;
        expect(formatDurationAsTime(input)).toEqual("01:01");
    });

    test("610100 seconds", () => {
        const input = 610100;
        expect(formatDurationAsTime(input)).toEqual("10:10");
    });

    test("610800 seconds", () => {
        const input = 610800;
        expect(formatDurationAsTime(input)).toEqual("10:10");
    });


    test("611000 seconds", () => {
        const input = 611000;
        expect(formatDurationAsTime(input)).toEqual("10:11");
    });


    test(".1 seconds", () => {
        const input = 100;
        expect(formatDurationAsTime(input)).toEqual("00:00");
    });

    test(".9 seconds", () => {
        const input = 100;
        expect(formatDurationAsTime(input)).toEqual("00:00");
    });
});


describe("numDaysAgo", () => {
    test("same date", () => {
        const t = new Date();
        const y = t;

        expect(numDaysAgoFromMidnights(y, t)).toEqual(0);
    });

    test("1 hour ago", () => {
        const t = new Date();
        t.setHours(12);
        const y = new Date(t.getTime());
        y.setHours(t.getHours() - 1);

        expect(numDaysAgoFromMidnights(y, t)).toEqual(0);
    });

    test("24 hours ago", () => {
        const t = new Date();
        t.setHours(12);
        const y = new Date(t.getTime());
        y.setHours(t.getHours() - 24);

        expect(numDaysAgoFromMidnights(y, t)).toEqual(1);
    });

    test("36 hours ago", () => {
        const t = new Date();
        t.setHours(12);
        const y = new Date(t.getTime());
        y.setHours(t.getHours() - 36);

        expect(numDaysAgoFromMidnights(y, t)).toEqual(1);
    });

    test("48 hours ago", () => {
        const t = new Date();
        const y = new Date(t.getTime());
        y.setHours(t.getHours() - 48);

        expect(numDaysAgoFromMidnights(y, t)).toEqual(2);
    });
});

describe("get streak", () => {
    test("empty list", () => {
        const startTime = DateTime.local().set({hour: 12, minute: 0, second: 0}).toJSDate();
        const dates: Date[] = [];
        expect(getStreak(dates, startTime)).toEqual(0);
    });

    test("with today", () => {
        const startTime = DateTime.local().set({hour: 12, minute: 0, second: 0}).toJSDate();
        const dates: Date[] = [
            new Date(),
        ];
        expect(getStreak(dates, startTime)).toEqual(1);
    });

    test("2 days in streak, 2 dates", () => {
        const startTime = DateTime.local().set({hour: 12, minute: 0, second: 0});
        const dates: Date[] = [
            startTime.minus({hours: 6}).toJSDate(),
            startTime.minus({hours: 13}).toJSDate(),
            // DateTime.local().minus({days: 5}).toJSDate(),
        ];
        expect(getStreak(dates, startTime.toJSDate())).toEqual(2);
    });


    test("2 days in streak, 3 dates, exactly 2 days ago", () => {
        const startTime = DateTime.local().set({hour: 12, minute: 0, second: 0});
        const dates: Date[] = [
            startTime.minus({hours: 6}).toJSDate(),
            startTime.minus({hours: 13}).toJSDate(),
            startTime.minus({hours: 36, minutes: 0}).toJSDate(),
        ];
        expect(getStreak(dates, startTime.toJSDate())).toEqual(2);
    });

    test("3 days in streak, 3 dates", () => {
        const startTime = DateTime.local().set({hour: 12, minute: 0, second: 0});
        const dates: Date[] = [
            startTime.minus({hours: 6}).toJSDate(),
            startTime.minus({hours: 13}).toJSDate(),
            startTime.minus({hours: 36, minutes: 1}).toJSDate(),
        ];
        expect(getStreak(dates, startTime.toJSDate())).toEqual(3);
    });

    test("broken streak after 2 days, 4 dates", () => {
        const startTime = DateTime.local().set({hour: 12, minute: 0, second: 0});
        const dates: Date[] = [
            startTime.minus({hours: 6}).toJSDate(),
            startTime.minus({hours: 13}).toJSDate(),
            startTime.minus({hours: 90}).toJSDate(),
            startTime.minus({hours: 100, minutes: 1}).toJSDate(),
        ];
        expect(getStreak(dates, startTime.toJSDate())).toEqual(2);
    });

    test("broken streak after 3 days, 4 dates", () => {
        const startTime = DateTime.local().set({hour: 12, minute: 0, second: 0});
        const dates: Date[] = [
            startTime.minus({hours: 6}).toJSDate(),
            startTime.minus({hours: 13}).toJSDate(),
            startTime.minus({hours: 37}).toJSDate(),
            startTime.minus({hours: 100, minutes: 1}).toJSDate(),
        ];
        expect(getStreak(dates, startTime.toJSDate())).toEqual(3);
    });


});