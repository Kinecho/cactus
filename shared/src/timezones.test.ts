import {
    deprecatedTimezoneMap, findByZoneName,
    getCanonicalName, getValidTimezoneName, isZoneSameTime, KNOWN_ZONES,
    luxonValidTimezones,
    timezoneInfoList,
    zoneToDisplayName
} from "@shared/timezones";

test("List valid timezones", () => {
    expect(luxonValidTimezones).toContain("America/Detroit");
});

test("Valid zones size matches input list size", () => {
    expect(luxonValidTimezones.length).toEqual(KNOWN_ZONES.length)
});

test("zones by offset", () => {
    console.log(JSON.stringify(timezoneInfoList, null, 2));
    expect(timezoneInfoList).not.toBeNull()
});

test("Ensure all display name zones are canonical", () => {
    const displayZones = Object.keys(zoneToDisplayName);
    const notFound: string[] = [];
    displayZones.forEach(zoneName => {
        const canonical = getCanonicalName(zoneName);
        expect(canonical).not.toBeUndefined();
        if (!canonical) {
            notFound.push(zoneName);
        }
    });
    console.log(`Timezones without a canonical zonename: ${notFound.length}`);
    expect(notFound).toHaveLength(0)

});

test("ensure all deprecated zones can get zone info", () => {
    const deprecatedZones = Object.keys(deprecatedTimezoneMap);
    const notFound: string[] = [];
    const notFoundCanonical = new Set<string | undefined>();
    deprecatedZones.forEach(zone => {
        const found = findByZoneName(zone);
        if (!found) {
            console.log(`Deprecated Zone: ${zone} did not have info returned. Canonical name = ${getCanonicalName(zone)}`);
            notFound.push(zone);
            const canonical = getCanonicalName(zone);
            notFoundCanonical.add(canonical)
        } else {
            console.log("Found zoneInfo for", zone, found);
            expect(found.zoneName).toBeDefined();
            expect(found.offsetDisplay).toBeDefined();
            expect(found.offsetMinutes).toBeDefined();
        }
    });
    console.log(`${notFoundCanonical.size} canonical zones without info`, notFoundCanonical);
    console.log(`Deprecated zones with no info: ${notFound.length}\n${JSON.stringify(notFound, null, 2)}`);
    expect(notFoundCanonical.size).toEqual(0);
    expect(notFound).toHaveLength(0)
});


test("ensure all mapped zones can get zone info", () => {
    const knownZones = KNOWN_ZONES;
    const notFound: string[] = [];
    const notFoundCanonical = new Set<string | undefined>();
    knownZones.forEach(zone => {
        const found = findByZoneName(zone);
        if (!found) {
            console.log(`Zone: ${zone} did not have info returned. Canonical name = ${getCanonicalName(zone)}`);
            notFound.push(zone);
            const canonical = getCanonicalName(zone);
            notFoundCanonical.add(canonical)
        } else {
            console.log("Found zoneInfo for", zone, found);
            expect(found.zoneName).toBeDefined();
            expect(found.offsetDisplay).toBeDefined();
            expect(found.offsetMinutes).toBeDefined();
        }
    });
    console.log(`${notFoundCanonical.size} canonical zones without info`, notFoundCanonical);
    console.log(`zones with no info: ${notFound.length}\n${JSON.stringify(notFound, null, 2)}`);
    expect(notFoundCanonical.size).toEqual(0);
    expect(notFound).toHaveLength(0)
});

test("get zone info for Europe/London", () => {
    const zone = 'Europe/London';
    const info = findByZoneName(zone);
    expect(info).not.toBeUndefined();
});

describe("Equal Zones", () => {
    test("Expect utc and gmt+/-0 to be equal", () => {
        expect(isZoneSameTime("Etc/UTC", "Etc/GMT+0")).toBeTruthy();
        expect(isZoneSameTime("Etc/UTC", "Etc/UTC")).toBeTruthy();
        expect(isZoneSameTime("UCT", "Etc/UTC")).toBeTruthy();
        expect(isZoneSameTime("UCT", "Etc/GMT+0")).toBeTruthy();
        expect(isZoneSameTime("Etc/UTC", "Etc/GMT-0")).toBeTruthy();
        expect(isZoneSameTime("Etc/GMT-0", "Etc/UTC")).toBeTruthy();
        expect(isZoneSameTime("Etc/GMT+0", "Etc/UTC")).toBeTruthy();
    });

    test("utc is not the same as gmt offsets", () => {
        expect(isZoneSameTime("Etc/GMT+10", "Etc/UTC")).toBeFalsy();
        expect(isZoneSameTime("Etc/GMT+01", "Etc/UTC")).toBeFalsy();
        expect(isZoneSameTime("Etc/UTC", "Etc/GMT+2")).toBeFalsy();
    })
});

describe("Get valid timezones", () => {
    test("Known invalid timezones", () => {
        expect(getValidTimezoneName("BadZone")).toBeUndefined()
    });

    test("Known timezones", () => {
        KNOWN_ZONES.forEach(zone => {
            console.log("checking ", zone);
            expect(getValidTimezoneName(zone)).toBeDefined();
            expect(getValidTimezoneName(zone)).toEqual(getCanonicalName(zone))
        })
    });

    test("Known deprecated timezones", () => {
        const deprecatedZones = Object.keys(deprecatedTimezoneMap);
        deprecatedZones.forEach(zone => {
            console.log("checking ", zone);
            expect(getValidTimezoneName(zone)).toBeDefined();
            expect(getValidTimezoneName(zone)).toEqual(getCanonicalName(zone))
        })
    });

    test("Known canonical timezones", () => {
        const canonicalZones = Object.values(deprecatedTimezoneMap);
        canonicalZones.forEach(zone => {
            console.log("checking ", zone);
            expect(getValidTimezoneName(zone)).toBeDefined();
            expect(getValidTimezoneName(zone)).toEqual(zone)
        })
    });
});