import {DateTime} from "luxon";
import {ISODate} from "@shared/mailchimp/models/MailchimpTypes";

export const mailchimpTimeZone = "America/Denver";

/**
 *
 * @param {Date} [date=new Date()]
 * @return {string}
 */
export function getMailchimpDateString(date:Date=new Date()):string{
    return DateTime.fromJSDate(date).setZone(mailchimpTimeZone).toISODate();
}

export function makeUTCDateIntoMailchimpDate(date:Date, keepTime:boolean=false, timezone=mailchimpTimeZone):string {
    let dateWithZone = DateTime.fromJSDate(date).setZone(timezone);
    if (keepTime){
        dateWithZone = dateWithZone.set({hour: date.getHours(), second: date.getSeconds(), minute: date.getMinutes()});
    }

    return dateWithZone.toISO();
}

export function getDateFromISOString(input? :ISODate):Date|undefined{
    if (!input){
        return;
    }

    return DateTime.fromISO(input).toUTC().toJSDate() || undefined;
}

export function stringFromISODate(input?:ISODate|null, format="yyyy-LL-dd"){
    if (!input){
        return null;
    }

    return DateTime.fromISO(input).toFormat(format);
}