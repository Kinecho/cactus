import {DateObject, DateTime, Duration} from "luxon";
import {ISODate} from "@shared/mailchimp/models/MailchimpTypes";
import * as prettyMilliseconds from "pretty-ms";
import {isTimestamp, timestampToDate} from "@shared/util/FirestoreUtil";
import {PromptSendTime} from "@shared/models/CactusMember";

export const mailchimpTimeZone = "America/Denver";

/**
 *
 * @param {Date} [date=new Date()]
 * @return {string}
 */
export function getMailchimpDateString(date: Date = new Date()): string {
    return DateTime.fromJSDate(date).setZone(mailchimpTimeZone).toISODate();
}

// export function getDateForTimezone(timeZone: string, date: Date): Date {
//     return DateTime.fromJSDate(date ).setZone(timeZone, {keepLocalTime: false}).toJSDate();
// }

export function getDateObjectForTimezone(date: Date, timeZone: string): DateObject {
    return DateTime.fromJSDate(date).setZone(timeZone).toObject()
}

export function dateObjectToISODate(date: DateObject): string {
    return DateTime.fromObject(date).toISODate()
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


export function formatDateTime(date?: Date, options: { format?: string, timezone?: string } = {}): string | undefined {
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
    return DateTime.fromJSDate(date).plus({days: days}).toJSDate();
}

export function minusDays(days: number, date: Date = new Date()): Date {
    return DateTime.fromJSDate(date).minus({days: days}).toJSDate();
}

export function plusHours(hours: number, date: Date = new Date()): Date {
    return DateTime.fromJSDate(date).plus({hours}).toJSDate();
}

export function minusHours(hours: number, date: Date = new Date()): Date {
    return DateTime.fromJSDate(date).minus({hours}).toJSDate();
}

export function minutesToMilliseconds(minutes: number): number {
    return Duration.fromObject({minutes: minutes}).valueOf();
}

export function hoursToMilliseconds(hours: number): number {
    return Duration.fromObject({hours: hours}).valueOf();
}

export function makeUTCDateIntoMailchimpDate(date: Date, keepTime: boolean = false, timezone = mailchimpTimeZone): string {
    let dateWithZone = DateTime.fromJSDate(date).setZone(timezone);
    if (keepTime) {
        dateWithZone = dateWithZone.set({hour: date.getHours(), second: date.getSeconds(), minute: date.getMinutes()});
    }

    return dateWithZone.toISO();
}

export function isoDateStringToFlamelinkDateString(input?: string | undefined): string | undefined {
    const date = getDateFromISOString(input);
    if (!date) {
        return;
    }

    return DateTime.fromJSDate(date).setZone(mailchimpTimeZone).toISO({
        includeOffset: false,
        suppressMilliseconds: true,
        suppressSeconds: true
    });
}

export function getFlamelinkDateString(date: Date = new Date()): string {
    return DateTime.fromJSDate(date).toISO({includeOffset: false, suppressMilliseconds: true, suppressSeconds: true});
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
        .setZone(mailchimpTimeZone, {keepLocalTime: false})
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

    console.warn("Could not convert input of ", input, "to date");
    return;

}

export function formatDurationAsTime(duration: number): string {
    const minutes = Math.floor(duration / 60 / 1000);
    const seconds = (Math.floor(duration / 1000)) % 60;

    const ss = seconds < 10 ? `0${seconds}` : `${seconds}`;
    const mm = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${mm}:${ss}`

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
    return `${Math.floor(diff[unit])} ${label} ago`;
}

export function millisecondsToMinutes(duration: number, decimals: number = 1): string {
    const seconds = duration / 1000;
    const minutes = seconds / 60;
    return minutes.toFixed(decimals);
}

export function numDaysAgoFromMidnights(date: Date, today: Date = new Date(), timeZone?: string): number {
    let dt = DateTime.fromJSDate(date);
    let t = DateTime.fromJSDate(today);
    if (timeZone) {
        dt = dt.setZone(timeZone);
        t = t.setZone(timeZone);
    }

    dt = dt.set({hour: 0, minute: 0, millisecond: 0, second: 0});
    t = t.set({hour: 0, minute: 0, millisecond: 0, second: 0});

    return Math.round(t.diff(dt).as("day"))
}

export function atMidnight(date: Date): Date {
    return DateTime.fromJSDate(date).set({hour: 0, minute: 0, millisecond: 0, second: 0}).toJSDate();
}

/**
 * * Assumes ordered by date DESC already
 * @param {{dates: Date[], start?: Date|undefined, timeZone?: string|undefined}} options
 * @return {number}
 */
export function getStreak(options: { dates: Date[], start?: Date, timeZone?: string }) {
    const {dates = [], start = new Date(), timeZone} = options;
    console.log('calculating streak for timezone', timeZone);
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


export function getSendTimeUTC(options: { timeZone?: string | undefined | null, sendTime?: PromptSendTime | undefined, forDate?: Date }): PromptSendTime | undefined {
    const timeZone = options.timeZone;
    if (!timeZone) {
        return;
    }
    const timePref = options.sendTime;
    if (!timePref) {
        return;
    }

    const {hour, minute} = DateTime.fromJSDate(options.forDate || new Date()).setZone(timeZone).set(timePref).setZone("utc").toObject();
    if (hour !== undefined && minute !== undefined) {
        return {hour, minute} as PromptSendTime;
    }
    return undefined;
}