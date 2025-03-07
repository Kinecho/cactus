import {DateTime} from "luxon";
import Logger from "@shared/Logger";

const logger = new Logger("timezones.ts");

const timezones = [
    "Etc/GMT+12",
    "Pacific/Midway",
    "Pacific/Honolulu",
    "America/Juneau",
    "America/Dawson",
    "America/Denver",
    "America/Chihuahua",
    "America/Phoenix",
    "America/Chicago",
    "America/Regina",
    "America/Mexico_City",
    "America/Belize",
    "America/Detroit",
    "America/Indiana/Indianapolis",
    "America/Bogota",
    "America/Noronha",
    "America/Glace_Bay",
    "America/Caracas",
    "America/Santiago",
    "America/St_Johns",
    "America/Sao_Paulo",
    "America/Argentina/Buenos_Aires",
    "America/Godthab",
    "Etc/GMT+2",
    "Atlantic/Azores",
    "Atlantic/Cape_Verde",
    "GMT",
    "Africa/Casablanca",
    "Atlantic/Canary",
    "Europe/London",
    'Pacific/Easter',
    'Etc/GMT',
    'Etc/UTC',
    'Pacific/Chatham',
    'America/Adak',
    "Europe/Belgrade",
    "Europe/Sarajevo",
    "Europe/Brussels",
    "Europe/Amsterdam",
    "Africa/Algiers",
    "Europe/Bucharest",
    "Africa/Cairo",
    "Europe/Helsinki",
    "Europe/Athens",
    "Asia/Jerusalem",
    "Africa/Harare",
    "Europe/Moscow",
    "Asia/Kuwait",
    "Africa/Nairobi",
    "Asia/Baghdad",
    "Asia/Tehran",
    "Asia/Dubai",
    "Asia/Baku",
    "Asia/Kabul",
    "Asia/Yekaterinburg",
    "Asia/Karachi",
    "Asia/Kolkata",
    "Asia/Kathmandu",
    "Asia/Dhaka",
    "Asia/Colombo",
    "Asia/Almaty",
    "Asia/Rangoon",
    "Asia/Bangkok",
    "Asia/Krasnoyarsk",
    "Asia/Shanghai",
    "Asia/Kuala_Lumpur",
    "Asia/Taipei",
    "Australia/Perth",
    "Asia/Irkutsk",
    "Asia/Seoul",
    "Asia/Tokyo",
    "Asia/Yakutsk",
    "Australia/Darwin",
    "Australia/Adelaide",
    "Australia/Sydney",
    "Australia/Brisbane",
    "Australia/Hobart",
    "Asia/Vladivostok",
    "Australia/Lord_Howe",
    "Pacific/Guam",
    "Asia/Magadan",
    "Pacific/Fiji",
    "Pacific/Auckland",
    "Pacific/Tongatapu"
];

export const KNOWN_ZONES = timezones;

export const deprecatedTimezoneMap: { [deprecated: string]: string } = {
    "Australia/ACT": "Australia/Sydney",
    "Australia/LHI": "Australia/Lord_Howe",
    "Australia/North": "Australia/Darwin",
    "Australia/NSW": "Australia/Sydney",
    "Australia/Queensland": "Australia/Brisbane",
    "Australia/South": "Australia/Adelaide",
    "Australia/Tasmania": "Australia/Hobart",
    "Australia/Victoria": "Australia/Melbourne",
    "Australia/West": "Australia/Perth",
    "Brazil/Acre": "America/Rio_Branco",
    "Brazil/DeNoronha": "America/Noronha",
    "Brazil/East": "America/Sao_Paulo",
    "Brazil/West": "America/Manaus",
    "Canada/Atlantic": "America/Halifax",
    "Canada/Central": "America/Winnipeg",
    "Canada/Eastern": "America/Toronto",
    "Canada/Mountain": "America/Edmonton",
    "Canada/Newfoundland": "America/St_Johns",
    "Canada/Pacific": "America/Vancouver",
    "Canada/Saskatchewan": "America/Regina",
    "Canada/Yukon": "America/Whitehorse",
    "CET": "Europe/Paris",
    "Chile/Continental": "America/Santiago",
    "Chile/EasterIsland": "Pacific/Easter",
    "CST6CDT": "America/Chicago",
    "Cuba": "America/Havana",
    "EET": "Europe/Sofia",
    "Egypt": "Africa/Cairo",
    "Eire": "Europe/Dublin",
    "EST": "America/Cancun",
    "EST5EDT": "America/New_York",
    "GB": "Europe/London",
    "GMT0": "Etc/GMT",
    "Greenwich": "Etc/GMT",
    "Hongkong": "Asia/Hong_Kong",
    "HST": "Pacific/Honolulu",
    "Iceland": "Atlantic/Reykjavik",
    "Iran": "Asia/Tehran",
    "Israel": "Asia/Jerusalem",
    "Jamaica": "America/Jamaica",
    "Japan": "Asia/Tokyo",
    "Kwajalein": "Pacific/Kwajalein",
    "Libya": "Africa/Tripoli",
    "MET": "Europe/Paris",
    "GMT-0": "Etc/GMT",
    "GB-Eire": "Europe/London",
    "GMT+0": "Etc/GMT",
    "Etc/Greenwich": "Etc/GMT",
    "Etc/Universal": "Etc/UTC",
    "Etc/Zulu": "Etc/UTC",
    "Mexico/BajaNorte": "America/Tijuana",
    "Mexico/BajaSur": "America/Mazatlan",
    "Mexico/General": "America/Mexico_City",
    "MST": "America/Phoenix",
    "MST7MDT": "America/Denver",
    "Navajo": "America/Denver",
    "NZ": "Pacific/Auckland",
    "NZ-CHAT": "Pacific/Chatham",
    "Poland": "Europe/Warsaw",
    "Portugal": "Europe/Lisbon",
    "PRC": "Asia/Shanghai",
    "PST8PDT": "America/Los_Angeles",
    "ROC": "Asia/Taipei",
    "ROK": "Asia/Seoul",
    "Singapore": "Asia/Singapore",
    "Turkey": "Europe/Istanbul",
    "UCT": "Etc/UTC",
    "Universal": "Etc/UTC",
    "US/Alaska": "America/Anchorage",
    "US/Aleutian": "America/Adak",
    "US/Arizona": "America/Phoenix",
    "US/Central": "America/Chicago",
    "US/Eastern": "America/New_York",
    "US/East-Indiana": "America/Indiana/Indianapolis",
    "US/Hawaii": "Pacific/Honolulu",
    "US/Indiana-Starke": "America/Indiana/Knox",
    "US/Michigan": "America/Detroit",
    "US/Mountain": "America/Denver",
    "US/Pacific": "America/Los_Angeles",
    "US/Pacific-New": "America/Los_Angeles",
    "US/Samoa": "Pacific/Pago_Pago",
    "WET": "Europe/Lisbon",
    "W-SU": "Europe/Moscow",
    "Zulu": "Etc/UTC",
};

export const zoneToDisplayName: { [key: string]: string } = {
    "Etc/GMT+12": "International Date Line West",
    "Pacific/Midway": "Midway Island, Samoa",
    "Pacific/Honolulu": "Hawaii",
    "America/Juneau": "Alaska",
    "America/Dawson": "Pacific Time (US and Canada); Tijuana",
    "America/Denver": "Mountain Time (US and Canada)",
    "America/Chihuahua": "Chihuahua, La Paz, Mazatlan",
    "America/Phoenix": "Arizona",
    "America/Chicago": "Central Time (US and Canada)",
    "America/Regina": "Saskatchewan",
    "America/Mexico_City": "Guadalajara, Mexico City, Monterrey",
    "America/Belize": "Central America",
    "America/Detroit": "Eastern Time (US and Canada)",
    "America/Indiana/Indianapolis": "Indiana (East)",
    "America/Bogota": "Bogota, Lima, Quito",
    "America/Glace_Bay": "Atlantic Time (Canada)",
    "America/Caracas": "Caracas, La Paz",
    "America/Santiago": "Santiago",
    "America/St_Johns": "Newfoundland and Labrador",
    "America/Sao_Paulo": "Brasilia",
    "America/Argentina/Buenos_Aires": "Buenos Aires, Georgetown",
    "America/Godthab": "Greenland",
    "America/Noronha": "Pernambuco, Brazil",
    "Etc/GMT+2": "Mid-Atlantic",
    "Atlantic/Azores": "Azores",
    "Atlantic/Cape_Verde": "Cape Verde Islands",
    "GMT": "Dublin, Edinburgh, Lisbon, London",
    "Africa/Casablanca": "Casablanca, Monrovia",
    "Atlantic/Canary": "Canary Islands",
    "Europe/Belgrade": "Belgrade, Bratislava, Budapest, Ljubljana, Prague",
    "Europe/Sarajevo": "Sarajevo, Skopje, Warsaw, Zagreb",
    "Europe/Brussels": "Brussels, Copenhagen, Madrid, Paris",
    "Europe/Amsterdam": "Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna",
    "Africa/Algiers": "West Central Africa",
    "Europe/Bucharest": "Bucharest",
    "Africa/Cairo": "Cairo",
    "Europe/Helsinki": "Helsinki, Kiev, Riga, Sofia, Tallinn, Vilnius",
    "Europe/Athens": "Athens, Istanbul, Minsk",
    "Asia/Jerusalem": "Jerusalem",
    "Africa/Harare": "Harare, Pretoria",
    "Europe/Moscow": "Moscow, St. Petersburg, Volgograd",
    "Asia/Kuwait": "Kuwait, Riyadh",
    "Africa/Nairobi": "Nairobi",
    "Asia/Baghdad": "Baghdad",
    "Asia/Tehran": "Tehran",
    "Asia/Dubai": "Abu Dhabi, Muscat",
    "Asia/Baku": "Baku, Tbilisi, Yerevan",
    "Asia/Kabul": "Kabul",
    "Asia/Yekaterinburg": "Ekaterinburg",
    "Asia/Karachi": "Islamabad, Karachi, Tashkent",
    "Asia/Kolkata": "Chennai, Kolkata, Mumbai, New Delhi",
    "Asia/Kathmandu": "Kathmandu",
    "Asia/Dhaka": "Astana, Dhaka",
    "Asia/Colombo": "Sri Jayawardenepura",
    "Asia/Almaty": "Almaty, Novosibirsk",
    "Asia/Rangoon": "Yangon Rangoon",
    "Asia/Bangkok": "Bangkok, Hanoi, Jakarta",
    "Asia/Krasnoyarsk": "Krasnoyarsk",
    "Asia/Shanghai": "Beijing, Chongqing, Hong Kong SAR, Urumqi",
    "Asia/Kuala_Lumpur": "Kuala Lumpur, Singapore",
    "Asia/Taipei": "Taipei",
    "Australia/Perth": "Perth",
    "Asia/Irkutsk": "Irkutsk, Ulaanbaatar",
    "Asia/Seoul": "Seoul",
    "Asia/Tokyo": "Osaka, Sapporo, Tokyo",
    "Asia/Yakutsk": "Yakutsk",
    "Australia/Darwin": "Darwin",
    "Australia/Adelaide": "Adelaide",
    "Australia/Sydney": "Canberra, Melbourne, Sydney",
    "Australia/Brisbane": "Brisbane",
    "Australia/Hobart": "Hobart",
    "Asia/Vladivostok": "Vladivostok",
    "Pacific/Guam": "Guam, Port Moresby",
    "Asia/Magadan": "Magadan, Solomon Islands, New Caledonia",
    "Pacific/Fiji": "Fiji Islands, Kamchatka, Marshall Islands",
    "Pacific/Auckland": "Auckland, Wellington",
    "Pacific/Tongatapu": "Nuku'alofa"
};

export const luxonValidTimezones = timezones
    .filter(tz => DateTime.local().setZone(tz).isValid);


export interface ZoneInfo {
    displayName: string,
    offsetMinutes: number,
    zoneName: string,
    offsetDisplay: string,
}

export const timezoneInfoList: ZoneInfo[] = luxonValidTimezones.map((zoneName) => {
    const time = DateTime.local().setZone(zoneName);
    const offset = time.offset;
    const offsetDisplay = `GMT${time.toFormat("ZZ")}`;
    const displayName: string = zoneToDisplayName[zoneName];

    // if (!zoneMap[`${offset}`]) {
    //     zoneMap[`${offset}`] = [];
    // }
    // zoneMap[offset].push(zoneName);

    const info: ZoneInfo = {
        displayName,
        offsetMinutes: offset,
        zoneName,
        offsetDisplay,
    };
    return info;
}).sort((z1, z2) => {
    return z2.offsetMinutes - z1.offsetMinutes
});

export const zonesInfoByName: { [zoneName: string]: ZoneInfo } = timezoneInfoList.reduce((map: { [name: string]: ZoneInfo }, zone: ZoneInfo) => {
    map[zone.zoneName] = zone;
    return map;
}, {});

/**
 * Gets the canonical name ofo a timezone if the provided timezone provided was known to be deprecated, otherwise returns the original input.
 *
 * @param {string} zoneName
 * @return {string | undefined}
 */
export function getCanonicalName(zoneName?: string|null): string | undefined {
    if (!zoneName) {
        return;
    }
    const canonicalFromDeprecated = deprecatedTimezoneMap[zoneName];
    if (canonicalFromDeprecated) {
        return canonicalFromDeprecated
    }
    return zoneName;
}

/**
 * Get the valid name for a provided timezone input. If the timezone is not valid, or can not be mapped to a valid timezone, this returns undefined
 * @param {string} zoneName
 * @return {string | undefined}
 */
export function getValidTimezoneName(zoneName?: string|null): string|undefined {
    if (!zoneName) {
        return undefined;
    }
    const canonical = getCanonicalName(zoneName);
    if (!canonical) {
        return undefined;
    }
    if (DateTime.local().setZone(canonical).isValid) {
        return canonical
    }
    return undefined;
}

export function findByZoneName(zoneInput?: string): ZoneInfo | undefined {
    const zoneName = getCanonicalName(zoneInput);
    if (!zoneName) {
        return;
    }

    const zoneInfo = zonesInfoByName[zoneName];
    if (zoneInfo) {
        return zoneInfo;
    }

    const region = zoneName.split("/")[0];

    const zoneNamesByRegion = timezones.filter(z => z.startsWith(region));
    logger.log("zone options", zoneNamesByRegion);
    const matchedTimeZone = zoneNamesByRegion.find(zone => isZoneSameTime(zone, zoneName));
    logger.log("matched timezone: ", matchedTimeZone);

    if (matchedTimeZone) {
        return zonesInfoByName[matchedTimeZone];
    }

    return;
}

/**
 * Is the GMT offset timezone the same as a UTC one?
 * This is to help catch/prevent/fix an issue when running unit tests on a node environment.
 * It seems that the test runner environment didn't know how to parse timezones like Etc/GMT+10,
 * although the browser does (most of the time).
 * So this is some handling for those edge Etc/GMT and Etc/UTC cases.
 */
export function gmtIsUtc(z1: string, z2: string): boolean {
    return (z1 === "Etc/GMT+0" || z1 === "Etc/GMT-0" || z1 === "Etc/UTC") && (z2 === "Etc/GMT+0" || z2 === "Etc/GMT-0" || z2 === "Etc/UTC")
}

export function isZoneSameTime(zone1: string, zone2: string): boolean {
    const d = new Date();
    const z1 = getCanonicalName(zone1);
    const z2 = getCanonicalName(zone2);
    if (z1 === z2) {
        return true
    }
    if (!z1 || !z2) {
        logger.info(`Unable to determine canonical timezone for zones: ${zone1} = ${z1} | zone2 ${zone2} = ${z2}`);
        return false
    }
    if (gmtIsUtc(z1, z2)) {
        return true
    }
    if ((z1.startsWith("Etc/GMT") || z1 === "Etc/UTC") && (z2.startsWith("Etc/GMT") || z2 === "Etc/UTC")) {
        return false
    }

    try {
        const zone1Parts = d.toLocaleTimeString('en-us', {
            timeZone: zone1,
            timeZoneName: 'short'
        }).split(' ');

        const zone2Parts = d.toLocaleTimeString('en-us', {
            timeZoneName: 'short',
            timeZone: zone2
        }).split(' ');

        return zone1Parts[0] === zone2Parts[0] && zone1Parts[1] === zone2Parts[1];
    } catch (error) {
        logger.error(`Failed to parse timezone name returning false: zone1 ${zone1} = ${z1} | zone2 ${zone2} = ${z2}`);
        return false;
    }
}