import {
    daysUntilDate,
    differenceInMinutes,
    formatDate,
    formatDateTime,
    formatDuration,
    formatDurationAsTime,
    getCurrentQuarterHour,
    getDateAtMidnightDenver,
    getDateObjectForTimezone,
    getFlamelinkDateStringInDenver,
    getMailchimpDateString,
    getQuarterHourFromMinute,
    getSendTimeUTC,
    getStreakDays,
    getStreakMonths,
    getStreakWeeks,
    isoDateStringToFlamelinkDateString,
    AmericaDenverTimezone,
    makeUTCDateIntoMailchimpDate,
    numDaysAgoFromMidnights,
    plusDays,
    toTimestampMs, getDatesBetween,
} from "@shared/util/DateUtil";
import { DateTime } from "luxon";

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

describe("format date", () => {
    test("no format provided", () => {
        const denverTime = 1560924000000; //2019-06-19 at midnight
        const date = new Date(denverTime);
        expect(formatDate(date)).toEqual("2019-06-19")
    });

    test("format with day of week", () => {
        const denverTime = 1560924000000; //2019-06-19 at midnight
        const date = new Date(denverTime);
        expect(formatDate(date, "cccc, LLLL d, yyyy")).toEqual("Wednesday, June 19, 2019")
    });
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

    const suppressionDateISO = DateTime.fromISO("2019-02-21").minus({ days: 10 }).toISODate();
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

describe("format date time", () => {
    test("denver options", () => {
        const denverTime = 1560924000000; //2019-06-19 at midnight
        const date = new Date(denverTime);
        expect(formatDateTime(date, { timezone: "America/Denver" })).toEqual("2019-06-19 12:00 AM MDT")
    });

    test("new york timezone", () => {
        const denverTime = 1560924000000; //2019-06-19 at midnight
        const date = new Date(denverTime);
        expect(formatDateTime(date, { timezone: "America/New_York" })).toEqual("2019-06-19 2:00 AM EDT")
    });

    test("paris timezone", () => {
        const denverTime = 1560924000000; //2019-06-19 at midnight
        const date = new Date(denverTime);
        expect(formatDateTime(date, { timezone: "Europe/Paris" })).toEqual("2019-06-19 8:00 AM GMT+2")
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


    test("Get diff with timezone", () => {
        const d1 = new Date(1576520560489); // 2019-12-16 13:22:40.489902 local time
        const d2 = new Date(1576468965682); // 2019-12-15 23:02:45.682170

        const timeZone = 'America/Indiana/Indianapolis';

        expect(numDaysAgoFromMidnights(d2, d1, timeZone)).toEqual(1);

    })
});

describe("get streak days", () => {
    test("empty list", () => {
        const startTime = DateTime.local().set({ hour: 12, minute: 0, second: 0 }).toJSDate();
        const dates: Date[] = [];
        expect(getStreakDays({ dates, start: startTime })).toEqual(0);
    });

    test("with today", () => {
        const startTime = DateTime.local().set({ hour: 12, minute: 0, second: 0 }).toJSDate();
        const dates: Date[] = [
            new Date(),
        ];
        expect(getStreakDays({ dates, start: startTime })).toEqual(1);
    });

    test("2 days in streak, 2 dates", () => {
        const startTime = DateTime.local().set({ day: 1, month: 9, year: 2019, hour: 12, minute: 0, second: 0 });
        const dates: Date[] = [
            startTime.minus({ hours: 6 }).toJSDate(),
            startTime.minus({ hours: 13 }).toJSDate(),
            // DateTime.local().minus({days: 5}).toJSDate(),
        ];
        expect(getStreakDays({ dates, start: startTime.toJSDate() })).toEqual(2);
    });


    test("2 days in streak, 3 dates, exactly 2 days ago", () => {
        const startTime = DateTime.local().set({ day: 1, month: 9, year: 2019, hour: 12, minute: 0, second: 0 });
        const dates: Date[] = [
            startTime.minus({ hours: 6 }).toJSDate(),
            startTime.minus({ hours: 13 }).toJSDate(),
            startTime.minus({ hours: 36, minutes: 0 }).toJSDate(),
        ];
        expect(getStreakDays({ dates, start: startTime.toJSDate() })).toEqual(2);
    });

    test("3 days in streak, 3 dates", () => {
        const startTime = DateTime.local().set({ day: 1, month: 9, year: 2019, hour: 12, minute: 0, second: 0 });
        const dates: Date[] = [
            startTime.minus({ hours: 6 }).toJSDate(),
            startTime.minus({ hours: 13 }).toJSDate(),
            startTime.minus({ hours: 36, minutes: 1 }).toJSDate(),
        ];
        expect(getStreakDays({ dates, start: startTime.toJSDate() })).toEqual(3);
    });

    test("broken streak after 2 days, 4 dates", () => {
        const startTime = DateTime.local().set({ day: 1, month: 9, year: 2019, hour: 12, minute: 0, second: 0 });
        const dates: Date[] = [
            startTime.minus({ hours: 6 }).toJSDate(),
            startTime.minus({ hours: 13 }).toJSDate(),
            startTime.minus({ hours: 90 }).toJSDate(),
            startTime.minus({ hours: 100, minutes: 1 }).toJSDate(),
        ];
        expect(getStreakDays({ dates, start: startTime.toJSDate() })).toEqual(2);
    });

    test("broken streak after 3 days, 4 dates", () => {
        const startTime = DateTime.local().set({ day: 1, month: 9, year: 2019, hour: 12, minute: 0, second: 0 });
        const dates: Date[] = [
            startTime.minus({ hours: 6 }).toJSDate(),
            startTime.minus({ hours: 13 }).toJSDate(),
            startTime.minus({ hours: 37 }).toJSDate(),
            startTime.minus({ hours: 100, minutes: 1 }).toJSDate(),
        ];
        expect(getStreakDays({ dates, start: startTime.toJSDate() })).toEqual(3);
    });

    test("streak with timezone, real data for Eastern timezone", () => {
        const timeZone = 'America/Indiana/Indianapolis';
        const timestamps = [
            1576520560489,
            1576468965682,
            1576363212643,
            1576292283141,
            1576193061765,
            1576192961578,
            1576097296788,
            1576007416334,
            1565707372701,
            1565707354956,
            1565525573711,
            1565525544646,
            1565525523582,
            1565525498802,
            1565192452432,
            1565107421255,
            1565107377164,
            1564623345024,
            1563828405541,
            1563717692487,
            1563591096497,
            1563510729012,
            1563374426411,
            1563297322264,
            1563202071036,
            1563060613445,
            1562867322967,
            1562814611544,
            1562686873083,
            1562606244685,
            1562518563032,
            1562467117095,
            1562368980145,
            1562246101550,
            1562157528224,
            1562114544815,
            1562014669798,
            1561951395839,
            1561858805949,
            1561778928623,
            1561741842984,
            1561689955165,
            1561565280764,
        ];

        const dates = timestamps.map(ts => new Date(ts));
        const start = new Date(1576520560489);
        const streak = getStreakDays({ dates, start, timeZone });
        console.log("found streak to be", streak);

        expect(streak).toEqual(7);
    })

});


describe("get streak weeks", () => {
    test("empty list", () => {
        const startTime = DateTime.local().set({ hour: 12, minute: 0, second: 0 }).toJSDate();
        const dates: Date[] = [];
        expect(getStreakWeeks({ dates, start: startTime })).toEqual(0);
    });

    test("with today", () => {
        const startTime = DateTime.local().set({ hour: 12, minute: 0, second: 0 }).toJSDate();
        const dates: Date[] = [
            new Date(),
        ];
        expect(getStreakWeeks({ dates, start: startTime })).toEqual(1);
    });

    test("reflected on Monday, and the previous Friday", () => {
        const startTime = DateTime.local(2020, 2, 10).set({ hour: 12, minute: 0, second: 0 });
        const dates: Date[] = [
            startTime.toJSDate(),
            startTime.minus({ days: 3 }).toJSDate(),
        ];
        expect(getStreakWeeks({ dates, start: startTime.toJSDate() })).toEqual(2);
    });

    test("reflected on Saturday, and the previous week's Monday (12 days apart)", () => {
        const startTime = DateTime.local(2020, 2, 8).set({ hour: 12, minute: 0, second: 0 });
        const dates: Date[] = [
            startTime.toJSDate(),
            startTime.minus({ days: 12 }).toJSDate(),
        ];
        expect(getStreakWeeks({ dates, start: startTime.toJSDate() })).toEqual(2);
    });

    test("reflected three times, but missed a week", () => {
        const startTime = DateTime.local(2020, 2, 8).set({ hour: 12, minute: 0, second: 0 });
        const dates: Date[] = [
            startTime.toJSDate(),
            startTime.minus({ days: 12 }).toJSDate(),
            startTime.minus({ days: 28 }).toJSDate(),
        ];
        expect(getStreakWeeks({ dates, start: startTime.toJSDate() })).toEqual(2);
    });

});


describe("get streak months", () => {
    test("empty list", () => {
        const startTime = DateTime.local().set({ hour: 12, minute: 0, second: 0 }).toJSDate();
        const dates: Date[] = [];
        expect(getStreakMonths({ dates, start: startTime })).toEqual(0);
    });

    test("with today", () => {
        const startTime = DateTime.local().set({ hour: 12, minute: 0, second: 0 }).toJSDate();
        const dates: Date[] = [
            new Date(),
        ];
        expect(getStreakMonths({ dates, start: startTime })).toEqual(1);
    });

    test("reflected on 15th day, and the previous month's 10th day", () => {
        const startTime = DateTime.local(2020, 2, 15).set({ hour: 12, minute: 0, second: 0 });
        const dates: Date[] = [
            startTime.toJSDate(),
            startTime.minus({ month: 1 }).minus({ day: 5 }).toJSDate(),
        ];
        expect(getStreakMonths({ dates, start: startTime.toJSDate() })).toEqual(2);
    });

    test("reflected many times, but missed a month", () => {
        const startTime = DateTime.local(2020, 2, 8).set({ hour: 12, minute: 0, second: 0 });
        const dates: Date[] = [
            startTime.toJSDate(),
            startTime.minus({ months: 1 }).toJSDate(),
            startTime.minus({ months: 2 }).toJSDate(),
            startTime.minus({ months: 3 }).toJSDate(),
            startTime.minus({ months: 6 }).toJSDate(),
            startTime.minus({ months: 7 }).toJSDate(),
        ];
        expect(getStreakMonths({ dates, start: startTime.toJSDate() })).toEqual(4);
    });

});


describe('Get Date at Midnight Denver', function () {
    test("8pm get date midnight denver from GMT at ", () => {
        const date = new Date(1566440539808); //approx 8:22pm denver on 8/21/2019
        console.log("starting date in local time", date);

        const denverOffset = DateTime.fromJSDate(date).setZone(AmericaDenverTimezone).offset / 60 * -1;
        console.log("denver offset", denverOffset);
        const localTimezoneOffset = date.getTimezoneOffset() / 60;
        console.log("local timezone offset", localTimezoneOffset);

        const offsetDifference = localTimezoneOffset - denverOffset;
        console.log("Offset difference", offsetDifference);
        const dayOffset = (offsetDifference) >= 4 ? -1 : 0;
        const expectedHour = Math.floor(24 - offsetDifference);
        console.log("expected hour", expectedHour >= 24 ? expectedHour - 24 : expectedHour);
        console.log("dayOffset", dayOffset);
        console.log("expected date", 21 + dayOffset);

        const expectedMinute = Math.abs((localTimezoneOffset % 1) * 60);

        const midnightDate = getDateAtMidnightDenver(date);
        console.log("midnight denver date", midnightDate.toLocaleString());
        expect(midnightDate.getDate()).toEqual(21 + dayOffset);
        expect(midnightDate.getHours()).toEqual(expectedHour >= 24 ? expectedHour - 24 : expectedHour); //should be whatever the timezone offest is that is running the test
        expect(midnightDate.getMinutes()).toEqual(expectedMinute);
        expect(midnightDate.getSeconds()).toEqual(0);
    });

    test("1 am get date midnight denver from GMT at 1am", () => {
        const date = new Date(1566371847820); //approx 01:17:38am denver on 8/21/2019
        console.log("starting date in local time", date.toLocaleString());

        const denverOffset = DateTime.fromJSDate(date).setZone(AmericaDenverTimezone).offset / 60 * -1;
        console.log("denver offset", denverOffset);
        const localTimezoneOffset = date.getTimezoneOffset() / 60;
        console.log("local timezone offset", localTimezoneOffset);


        const offsetDifference = localTimezoneOffset - denverOffset;
        console.log("Offset difference", offsetDifference);
        const dayOffset = (offsetDifference) >= 1 ? -1 : 0;
        const expectedHour = Math.floor(24 - offsetDifference);
        console.log("expected hour", expectedHour >= 24 ? expectedHour - 24 : expectedHour);
        console.log("dayOffset", dayOffset);
        console.log("expected date", 21 + dayOffset);

        const expectedMinute = Math.abs((localTimezoneOffset % 1) * 60);

        const midnightDate = getDateAtMidnightDenver(date);
        console.log("midnight denver date", midnightDate.toLocaleString());
        expect(midnightDate.getDate()).toEqual(21 + dayOffset);
        expect(midnightDate.getHours()).toEqual(expectedHour >= 24 ? expectedHour - 24 : expectedHour); //should be whatever the timezone offest is that is running the test
        expect(midnightDate.getMinutes()).toEqual(expectedMinute);
        expect(midnightDate.getSeconds()).toEqual(0);
    })
});

test("iso date to flamelink string", () => {
    const input = "2019-08-27T02:45:00.000-06:00";
    expect(isoDateStringToFlamelinkDateString(input)).toEqual("2019-08-27T02:45")
});


test("get local datetime for given zone", () => {
    const dt = DateTime.local();
    console.log("dt", dt);

    const newYorkDt = DateTime.fromObject({
        year: 2019,
        month: 12,
        day: 3,
        hour: 14,
        minute: 0,
        second: 0,
        millisecond: 0,
        zone: "America/New_York"
    });


    const denverDt = newYorkDt.setZone('America/Denver');

    const denverDate = denverDt.toJSDate();


    // const denverDate = getDateForTimezone('America/Denver', systemDate);
    // const denverObject =
    const tz = 'Asia/Bangkok'; //UTC+7 12 hours ahead of New York, 14 from denver
    const tzDate = getDateObjectForTimezone(denverDate, tz);


    console.log("denver", denverDt);
    console.log("bangkok", tzDate);

    expect(denverDt.day).toEqual(3);
    expect(denverDt.hour).toEqual(12);
    expect(denverDt.minute).toEqual(0);
    expect(denverDt.year).toEqual(2019);

    expect(tzDate.day).toEqual(4);
    expect(tzDate.hour).toEqual(2);
    expect(tzDate.month).toEqual(12);
    expect(tzDate.year).toEqual(2019);


});


describe("get prompt send time utc", () => {
    test("no values present", () => {
        expect(getSendTimeUTC({ timeZone: undefined, sendTime: undefined })).toBeUndefined();
        expect(getSendTimeUTC({ timeZone: 'America/Denver', sendTime: undefined })).toBeUndefined();
        expect(getSendTimeUTC({ timeZone: undefined, sendTime: { hour: 1, minute: 0 } })).toBeUndefined();
    });

    test("convert different timezones to UTC, for 2019-12-18 (standard time)", () => {
        const date = new Date(1576713600000); //2019-12-18 @ 5:01pm Mountain Time
        expect(getSendTimeUTC({
            timeZone: "America/Denver",
            sendTime: { hour: 0, minute: 0 },
            forDate: date,
        })).toEqual({
            hour: 7,
            minute: 0
        });
        expect(getSendTimeUTC({
            timeZone: "America/New_York",
            sendTime: { hour: 0, minute: 45 },
            forDate: date
        })).toEqual({
            hour: 5,
            minute: 45
        });
        expect(getSendTimeUTC({ timeZone: "UTC", sendTime: { hour: 0, minute: 45 }, forDate: date })).toEqual({
            hour: 0,
            minute: 45
        });
    });

    test("convert different timezones to UTC, for 2019-06-18 (daylight time)", () => {
        const date = new Date(1576713600000); //2019-12-18 @ 5:01pm Mountain Time
        date.setMonth(7); //set it to July, when it's daylight savings in USA
        expect(getSendTimeUTC({
            timeZone: "America/Denver",
            sendTime: { hour: 0, minute: 0 },
            forDate: date,
        })).toEqual({
            hour: 6,
            minute: 0
        });
        expect(getSendTimeUTC({
            timeZone: "America/New_York",
            sendTime: { hour: 0, minute: 45 },
            forDate: date
        })).toEqual({
            hour: 4,
            minute: 45
        });
        expect(getSendTimeUTC({ timeZone: "UTC", sendTime: { hour: 0, minute: 45 }, forDate: date })).toEqual({
            hour: 0,
            minute: 45
        });
    });
});

describe("Get current quarter hour", () => {
    test("various times", () => {
        const date = new Date(1576713600000); //2019-12-18 @ 5:01pm Mountain Time

        date.setMinutes(0);
        expect(getCurrentQuarterHour(date)).toEqual(0);

        date.setMinutes(14);
        expect(getCurrentQuarterHour(date)).toEqual(0);

        date.setMinutes(15);
        expect(getCurrentQuarterHour(date)).toEqual(15);

        date.setMinutes(16);
        expect(getCurrentQuarterHour(date)).toEqual(15);

        date.setMinutes(29);
        expect(getCurrentQuarterHour(date)).toEqual(15);

        date.setMinutes(30);
        expect(getCurrentQuarterHour(date)).toEqual(30);

        date.setMinutes(31);
        expect(getCurrentQuarterHour(date)).toEqual(30);

        date.setMinutes(34);
        expect(getCurrentQuarterHour(date)).toEqual(30);

        date.setMinutes(44);
        expect(getCurrentQuarterHour(date)).toEqual(30);

        date.setMinutes(45);
        expect(getCurrentQuarterHour(date)).toEqual(45);

        date.setMinutes(46);
        expect(getCurrentQuarterHour(date)).toEqual(45);


        date.setMinutes(59);
        expect(getCurrentQuarterHour(date)).toEqual(45);

        date.setMinutes(60);
        expect(getCurrentQuarterHour(date)).toEqual(0);

        date.setMinutes(65);
        expect(getCurrentQuarterHour(date)).toEqual(0);
    });

    test("get from minutes", () => {
        expect(getQuarterHourFromMinute(70)).toEqual(0);
        expect(getQuarterHourFromMinute(33)).toEqual(30);
        expect(getQuarterHourFromMinute(90)).toEqual(30);
    })
});

describe("Flamelink to and from", () => {
    test("2020-01-10T12:00:00-07:00", () => {
        const flamelinkIso = "2020-01-10T12:00:00-07:00";
        const date = new Date(flamelinkIso);
        expect(getFlamelinkDateStringInDenver(date)).toEqual(flamelinkIso)

    })
});

describe("toTimestampMs", () => {
    test("null -> undefined", () => {
        expect(toTimestampMs(null)).toBeUndefined();
    });

    test("undefined -> undefined", () => {
        expect(toTimestampMs(undefined)).toBeUndefined();
    });

    test("known Date -> number", () => {
        const date = new Date(111111111111);
        expect(toTimestampMs(date)).toEqual(111111111111);
    });

    test("number -> number", () => {
        expect(toTimestampMs(111111111111)).toEqual(111111111111);
    });
});

describe("daysUntil test", () => {
    test("check days until for various inputs", () => {
        expect(daysUntilDate(plusDays(7))).toEqual(7);
        expect(daysUntilDate(plusDays(3))).toEqual(3);
        expect(daysUntilDate(plusDays(1))).toEqual(1);
        expect(daysUntilDate(plusDays(0))).toEqual(0);
    })
});

describe("Get dates between", () => {
    test("Same day - no dates", () => {
        const d1 = DateTime.local(2020, 8, 1, 4);
        const d2 = DateTime.local(2020, 8, 1, 12);

        const dates = getDatesBetween(d1.toJSDate(), d2.toJSDate());
        expect(dates.length).toEqual(0)
    })

    test("Same day - JS date", () => {
        const d1 = new Date("Tue Aug 10 2020 14:30:12 GMT-0600");
        const d2 = new Date("Tue Aug 11 2020 15:30:12 GMT-0600");

        const dates = getDatesBetween(d1, d2);
        expect(dates.length).toEqual(0)
    })


    test("Next day - no dates", () => {
        const d1 = DateTime.local(2020, 8, 1);
        const d2 = DateTime.local(2020, 8, 2);

        const dates = getDatesBetween(d1.toJSDate(), d2.toJSDate());
        expect(dates.length).toEqual(0)
    })

    test("Two days apart - one date", () => {
        const d1 = DateTime.local(2020, 8, 1);
        const d2 = DateTime.local(2020, 8, 3);

        const dates = getDatesBetween(d1.toJSDate(), d2.toJSDate());
        expect(dates.length).toEqual(1)
        expect(DateTime.fromJSDate(dates[0]).day).toEqual(2)
    })

    test("Four days apart - three dates", () => {
        const d1 = DateTime.local(2020, 8, 1);
        const d2 = DateTime.local(2020, 8, 5);

        const dates = getDatesBetween(d1.toJSDate(), d2.toJSDate());
        expect(dates.length).toEqual(3)
        expect(DateTime.fromJSDate(dates[0]).day).toEqual(2)
        expect(DateTime.fromJSDate(dates[1]).day).toEqual(3)
        expect(DateTime.fromJSDate(dates[2]).day).toEqual(4)
    })
})