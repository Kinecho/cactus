import { DateObject, DateTime, Duration, Interval } from "luxon";
import { ISODate } from "@shared/mailchimp/models/MailchimpTypes";
import * as prettyMilliseconds from "pretty-ms";
import { isTimestamp, timestampToDate } from "@shared/util/FirestoreUtil";
import { PromptSendTime, QuarterHour } from "@shared/models/CactusMember";
import Logger from "@shared/Logger";
import { getValidTimezoneName } from "@shared/timezones";
import { isDate, isNull, isNumber } from "@shared/util/ObjectUtil";
import { isBlank } from "@shared/util/StringUtil";

const logger = new Logger("DateUtil.ts");

export const AmericaDenverTimezone = "America/Denver";

/**
 *
 * @param {Date} [date=new Date()]
 * @return {string}
 */
export function getMailchimpDateString(date: Date = new Date()): string {
    return DateTime.fromJSDate(date).setZone(AmericaDenverTimezone).toISODate();
}

export function fromMillisecondsString(input: string | undefined): Date | undefined {
    if (isBlank(input)) {
        return undefined;
    }
    const ms = Number(input);
    if (!isNumber(ms)) {
        return undefined;
    }
    return new Date(ms);
}

export function getDateObjectForTimezone(date: Date, timeZone: string): DateObject {
    return DateTime.fromJSDate(date).setZone(timeZone).toObject()
}

export function dateObjectToISODate(date: DateObject): string {
    return DateTime.fromObject(date).toISODate()
}

export function toTimestampMs(date: Date | undefined | number | null): number | undefined {
    if (isNull(date)) {
        return undefined;
    }
    if (isDate(date)) {
        return date.getTime();
    }
    if (isNumber(date)) {
        return Number(date);
    }
    return;
}

/**
 *
 * @param {Date} start
 * @param {Date} end
 * @return {string}
 */
export function formatDuration(start: Date, end: Date): string {
    return prettyMilliseconds(end.getTime() - start.getTime())
}

export function getISODate(date: Date = new Date()): string {
    return DateTime.fromJSDate(date).toISODate();
}

export function getISODateTime(date: Date = new Date()): string {
    return DateTime.fromJSDate(date).toISO();
}

export function formatDate(date?: Date, format = "yyyy-LL-dd"): string | undefined {
    if (!date) {
        return;
    }
    return DateTime.fromJSDate(date).toFormat(format);
}


export function formatDateTime(date?: Date, options: { format?: string, timezone?: string | null } = {}): string | undefined {
    const DEFAULT_FORMAT = "yyyy-LL-dd h:mm a ZZZZ";
    const {
        format = DEFAULT_FORMAT,
        timezone
    } = options;

    if (!date) {
        return;
    }
    let dt = DateTime.fromJSDate(date);
    if (timezone) {
        dt = dt.setZone(timezone);
    }

    return dt.toFormat(format)
}

export function plusDays(days: number, date: Date = new Date()): Date {
    return DateTime.fromJSDate(date).plus({ days: days }).toJSDate();
}

export function minusDays(days: number, date: Date = new Date()): Date {
    return DateTime.fromJSDate(date).minus({ days: days }).toJSDate();
}

export function plusHours(hours: number, date: Date = new Date()): Date {
    return DateTime.fromJSDate(date).plus({ hours }).toJSDate();
}

export function minusHours(hours: number, date: Date = new Date()): Date {
    return DateTime.fromJSDate(date).minus({ hours }).toJSDate();
}

export function minutesToMilliseconds(minutes: number): number {
    return Duration.fromObject({ minutes: minutes }).valueOf();
}

export function hoursToMilliseconds(hours: number): number {
    return Duration.fromObject({ hours: hours }).valueOf();
}

export function makeUTCDateIntoMailchimpDate(date: Date, keepTime: boolean = false, timezone = AmericaDenverTimezone): string {
    let dateWithZone = DateTime.fromJSDate(date).setZone(timezone);
    if (keepTime) {
        dateWithZone = dateWithZone.set({
            hour: date.getHours(),
            second: date.getSeconds(),
            minute: date.getMinutes()
        });
    }

    return dateWithZone.toISO();
}

export function currentDatePlusSeconds(seconds: number): Date {
    return new Date(Date.now() + 1000 * seconds);
}

export function isoDateStringToFlamelinkDateString(input?: string | undefined): string | undefined {
    const date = getDateFromISOString(input);
    if (!date) {
        return;
    }

    return DateTime.fromJSDate(date).setZone(AmericaDenverTimezone).toISO({
        includeOffset: false,
        suppressMilliseconds: true,
        suppressSeconds: true
    });
}

export function getFlamelinkDateString(date: Date = new Date()): string {
    return DateTime.fromJSDate(date).toISO({ includeOffset: false, suppressMilliseconds: true, suppressSeconds: true });
}

export function getFlamelinkDateStringInDenver(date: Date = new Date()): string {
    return DateTime.fromJSDate(date).setZone(AmericaDenverTimezone).set({ second: 0 }).toISO({
        includeOffset: true,
        suppressMilliseconds: true,
        suppressSeconds: false
    });
}

export function getDateFromISOString(input?: ISODate): Date | undefined {
    if (!input) {
        return;
    }

    return DateTime.fromISO(input).toUTC().toJSDate() || undefined;
}

export function localDateFromISOString(input?: string): Date | undefined {
    if (!input) {
        return;
    }
    return DateTime.fromISO(input).toJSDate()
}

export function getDateAtMidnightDenver(date: Date = new Date()): Date {
    const dt = DateTime.fromJSDate(date)
    .setZone(AmericaDenverTimezone, { keepLocalTime: false })
    .set({
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0
    });
    return dt.toJSDate();
}

export function stringFromISODate(input?: ISODate | null, format = "yyyy-LL-dd") {
    if (!input) {
        return null;
    }

    return DateTime.fromISO(input).toFormat(format);
}

export function differenceInMinutes(d1: Date, d2: Date): number {
    const dt1 = DateTime.fromJSDate(d1);
    const dt2 = DateTime.fromJSDate(d2);

    return dt1.diff(dt2).as("minutes")
}

export function asDate(input: any): Date | undefined {
    if (!input) {
        return;
    }

    if (input instanceof Date) {
        return input
    }

    if (isTimestamp(input)) {
        return timestampToDate(input)
    }
    if (typeof input === "string") {
        return getDateFromISOString(input);
    }

    if (typeof input === "number") {
        return new Date(input);
    }

    logger.warn("Could not convert input of ", input, "to date");
    return;

}

export function formatDurationAsTime(duration: number): string {
    const minutes = Math.floor(duration / 60 / 1000);
    const seconds = (Math.floor(duration / 1000)) % 60;

    const ss = seconds < 10 ? `0${ seconds }` : `${ seconds }`;
    const mm = minutes < 10 ? `0${ minutes }` : `${ minutes }`;
    return `${ mm }:${ ss }`

}

export function formatAsTimeAgo(date: Date) {
    const now = DateTime.local();
    const past = DateTime.fromJSDate(date);
    const secondsAgo = now.diff(past, 'seconds').seconds;
    let unit: 'seconds' |
    'minutes' |
    'hours' |
    'days' |
    'weeks' = 'seconds';

    if (secondsAgo < 60) {
        unit = 'seconds';
    } else if (secondsAgo >= 60 && secondsAgo < 3600) {
        unit = 'minutes';
    } else if (secondsAgo >= 3600 && secondsAgo < 86400) {
        unit = 'hours';
    } else if (secondsAgo >= 86400 && secondsAgo < 604800) {
        unit = 'days';
    } else {
        unit = 'weeks';
    }

    enum SingularDates {
        seconds = 'second',
        minutes = 'minute',
        hours = 'hour',
        days = 'day',
        weeks = 'week'
    }

    const diff = now.diff(past, unit);
    let label: string = unit;

    if (Math.floor(diff[unit]) === 1) {
        label = SingularDates[unit];
    }
    return `${ Math.floor(diff[unit]) } ${ label } ago`;
}

export function millisecondsToMinutes(duration: number, decimals: number = 1): string {
    const seconds = duration / 1000;
    let minutes = seconds / 60;
    if (decimals) {
        minutes = Math.round(minutes);
    }
    return minutes.toFixed(decimals);
}

export function numDaysAgoFromMidnights(date: Date, today: Date = new Date(), timeZone?: string): number {
    let dt = DateTime.fromJSDate(date);
    let t = DateTime.fromJSDate(today);
    if (timeZone) {
        dt = dt.setZone(timeZone);
        t = t.setZone(timeZone);
    }

    dt = dt.set({ hour: 0, minute: 0, millisecond: 0, second: 0 });
    t = t.set({ hour: 0, minute: 0, millisecond: 0, second: 0 });

    return Math.round(t.diff(dt).as("day"))
}

export function daysUntilDate(date: Date): number {
    const end = DateTime.fromJSDate(date).set({ hour: 0 });
    const interval = Interval.fromDateTimes(DateTime.local(), end);
    const days = interval.count("days") - 1;
    if (Number.isNaN(days)) {
        return 0;
    }
    return days;
}

export function atMidnight(date: Date): Date {
    return DateTime.fromJSDate(date).set({ hour: 0, minute: 0, millisecond: 0, second: 0 }).toJSDate();
}

/**
 * * Assumes ordered by date DESC already
 * @param {{dates: Date[], start?: Date|undefined, timeZone?: string|undefined}} options
 * @return {number}
 */
export function getStreakDays(options: { dates: Date[], start?: Date, timeZone?: string }) {
    const { dates = [], start = new Date(), timeZone } = options;
    let _dates = dates;
    if (_dates.length === 0) {
        return 0;
    }
    //find the index where the date is before the start date

    const startIndex = _dates.findIndex(date => date.getTime() <= start.getTime());
    _dates = _dates.slice(startIndex);

    if (_dates.length === 0) {
        return 0;
    }

    let streak = 0;
    let currentDate = start;
    let next = _dates[0];
    let i = 1;
    let diff = numDaysAgoFromMidnights(next, currentDate, timeZone);

    if (diff >= 0 && diff < 2) {
        streak = 1;
    }

    while (i < _dates.length && diff < 2) {
        currentDate = next;
        next = _dates[i];
        diff = numDaysAgoFromMidnights(next, currentDate, timeZone);
        if (diff > 0 && diff < 2) {
            streak++;
        }
        i++;
    }

    return streak;
}

/**
 * * Assumes ordered by date DESC already
 * @param {{dates: Date[], start?: Date|undefined, timeZone?: string|undefined}} options
 * @return {number}
 */
export function getStreakWeeks(options: { dates: Date[], start?: Date, timeZone?: string }) {
    const { dates = [], start = new Date(), timeZone } = options;
    let _dates = dates;
    if (_dates.length === 0) {
        return 0;
    }
    //find the index where the date is before the start date

    const startIndex = _dates.findIndex(date => date.getTime() <= start.getTime());
    _dates = _dates.slice(startIndex);

    if (_dates.length === 0) {
        return 0;
    }

    let streak = 1;
    let startDateTime = DateTime.fromJSDate(_dates[0]);
    if (timeZone) {
        startDateTime = startDateTime.setZone(timeZone);
    }
    let prevWeekStart = startDateTime.startOf('week').minus({ weeks: 1 });
    let prevWeekEnd = startDateTime.endOf('week').minus({ weeks: 1 });
    let i = 0;
    let reflectionDateTime;
    let weeksWithoutReflection = 0;

    while (_dates[i]) {
        reflectionDateTime = DateTime.fromJSDate(_dates[i]);

        // found a date in this week
        if (reflectionDateTime > prevWeekStart &&
        reflectionDateTime < prevWeekEnd) {
            streak++;
            prevWeekStart = prevWeekStart.minus({ weeks: 1 });
            prevWeekEnd = prevWeekEnd.minus({ weeks: 1 });

            // current date is before current week start
        } else if (reflectionDateTime < prevWeekStart) {
            prevWeekStart = prevWeekStart.minus({ weeks: 1 });
            prevWeekEnd = prevWeekEnd.minus({ weeks: 1 });
            weeksWithoutReflection++;
        }

        // streak broken, return
        if (weeksWithoutReflection > 1) {
            return streak;
        }

        i++;
    }

    return streak;
}

/**
 * * Assumes ordered by date DESC already
 * @param {{dates: Date[], start?: Date|undefined, timeZone?: string|undefined}} options
 * @return {number}
 */
export function getStreakMonths(options: { dates: Date[], start?: Date, timeZone?: string }) {
    const { dates = [], start = new Date(), timeZone } = options;
    let _dates = dates;
    if (_dates.length === 0) {
        return 0;
    }
    //find the index where the date is before the start date

    const startIndex = _dates.findIndex(date => date.getTime() <= start.getTime());
    _dates = _dates.slice(startIndex);

    if (_dates.length === 0) {
        return 0;
    }

    let streak = 1;
    let startDateTime = DateTime.fromJSDate(_dates[0]);
    if (timeZone) {
        startDateTime = startDateTime.setZone(timeZone);
    }
    let prevMonthStart = startDateTime.startOf('month').minus({ months: 1 });
    let prevMonthEnd = startDateTime.endOf('month').minus({ months: 1 });
    let i = 0;
    let reflectionDateTime;
    let monthsWithoutReflection = 0;

    while (_dates[i]) {
        reflectionDateTime = DateTime.fromJSDate(_dates[i]);

        // found a date in this week
        if (reflectionDateTime > prevMonthStart &&
        reflectionDateTime < prevMonthEnd) {
            streak++;
            prevMonthStart = prevMonthStart.minus({ months: 1 });
            prevMonthEnd = prevMonthEnd.minus({ months: 1 });

            // current date is before current week start
        } else if (reflectionDateTime < prevMonthStart) {
            prevMonthStart = prevMonthStart.minus({ months: 1 });
            prevMonthEnd = prevMonthEnd.minus({ months: 1 });
            monthsWithoutReflection++;
        }

        // streak broken, return
        if (monthsWithoutReflection > 1) {
            return streak;
        }

        i++;
    }

    return streak;
}

export function getSendTimeUTC(options: { timeZone?: string | undefined | null, sendTime?: PromptSendTime | undefined, forDate?: Date }): PromptSendTime | undefined {
    const timeZone = getValidTimezoneName(options.timeZone);
    if (!timeZone) {
        return;
    }
    const timePref = options.sendTime;
    if (!timePref) {
        return;
    }

    const { hour, minute } = DateTime.fromJSDate(options.forDate || new Date()).setZone(timeZone).set(timePref).setZone("utc").toObject();
    if (hour !== undefined && minute !== undefined) {
        return { hour, minute } as PromptSendTime;
    }
    return undefined;
}

export function getCurrentQuarterHour(date: Date = new Date()): QuarterHour {
    const m = date.getMinutes();
    return getQuarterHourFromMinute(m);
}

export function getQuarterHourFromMinute(input: number): QuarterHour {
    const m = input % 60;
    if (m < 15) {
        return 0;
    }
    if (m < 30) {
        return 15;
    }

    if (m < 45) {
        return 30
    }

    if (m < 60) {
        return 45;
    }

    return 45;
}

export function convertDateToSendTimeUTC(date: Date = new Date()): PromptSendTime {
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    const quarterHour = getQuarterHourFromMinute(minute);

    return { hour: hour, minute: quarterHour }
}

export function getContentQueryDateStrings(options: {
    systemDate?: Date,
    dateObject?: DateObject
}): { startDateString: string, endDateString: string } | undefined {
    const { systemDate, dateObject } = options;

    let startDateString;
    let endDateString;
    if (dateObject) {
        dateObject.hour = 0;
        dateObject.minute = 0;
        dateObject.second = 0;
        dateObject.millisecond = 0;
        endDateString = dateObjectToISODate(dateObject);
        const startTime = DateTime.fromObject(dateObject).plus({ days: 1 });

        if (!DateTime.fromObject(dateObject).isValid || !startTime.isValid) {
            logger.error(`The start date or end date were nto valid datetime objects: StartTime: ${ JSON.stringify(startTime.toObject()) } | EndTime: ${ JSON.stringify(dateObject) }`)
            return undefined;
        }
        const startObject = startTime.toObject();
        startDateString = dateObjectToISODate(startObject);
    } else if (systemDate) {
        const midnightDenver = new Date(systemDate); //make a copy of the date so we don't edit the original one
        midnightDenver.setHours(0);
        midnightDenver.setMinutes(0);
        midnightDenver.setSeconds(0);
        midnightDenver.setMilliseconds(0);
        const nextDate = plusDays(1, midnightDenver);
        nextDate.setHours(0);
        startDateString = getFlamelinkDateString(nextDate);
        endDateString = getFlamelinkDateString(midnightDenver);

    } else {
        logger.error("No valid date passed into getPromptContentForDate method");
        return undefined;
    }

    if (!startDateString || !endDateString) {
        logger.error(`Unable to get both a start date and end date string. StartDateString=${ startDateString } | EndDateString = ${ endDateString }`);
        return undefined;
    }

    return { startDateString, endDateString }
}

export function getDatesBetween(startDate: Date, endDate: Date): Date[] {
    let d1 = DateTime.fromJSDate(startDate)
    let d2 = DateTime.fromJSDate(endDate)

    const days = d2.diff(d1).as("days");
    if (days <= 1) {
        return []
    }

    let previous = d1;
    const array: Date[] = [];
    while(d2.diff(previous).as("days") > 1) {
        const next = previous.plus({day: 1})
        array.push(next.toJSDate())
        previous = next;
    }
    return array;
}