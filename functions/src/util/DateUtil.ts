import {DateTime} from "luxon";

export const mailchimpTimeZone = "America/Denver";


/**
 *
 * @param {Date} [date=new Date()]
 * @return {string}
 */
export function getMailchimpDateString(date:Date=new Date()):string{
    return DateTime.fromJSDate(date).setZone(mailchimpTimeZone).toISODate();
}