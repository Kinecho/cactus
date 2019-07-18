import {DateTime, Duration} from "luxon";
import {ISODate} from "@shared/mailchimp/models/MailchimpTypes";
import * as prettyMilliseconds from "pretty-ms";

export const mailchimpTimeZone = "America/Denver";

/**
 *
 * @param {Date} [date=new Date()]
 * @return {string}
 */
export function getMailchimpDateString(date: Date = new Date()): string {
    return DateTime.fromJSDate(date).setZone(mailchimpTimeZone).toISODate();
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

export function formatDate(date?: Date, format = "yyyy-LL-dd"): string | undefined {
    if (!date) {
        return;
    }
    return DateTime.fromJSDate(date).toFormat(format);
}


export function formatDateTime(date?: Date, format = "yyyy-LL-dd hh:mm a ZZZZ"): string | undefined {
    if (!date) {
        return;
    }
    return DateTime.fromJSDate(date).toFormat(format);
}

export function minusDays(days: number, date: Date = new Date()): Date {
    return DateTime.fromJSDate(date).minus({days: days}).toJSDate();
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

export function getDateFromISOString(input?: ISODate): Date | undefined {
    if (!input) {
        return;
    }

    return DateTime.fromISO(input).toUTC().toJSDate() || undefined;
}

export function stringFromISODate(input?: ISODate | null, format = "yyyy-LL-dd") {
    if (!input) {
        return null;
    }

    return DateTime.fromISO(input).toFormat(format);
}