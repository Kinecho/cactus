import {luxonValidTimezones, timezoneInfoList} from "@web/timezones";

test("List valid timezones", () => {
    const zones = luxonValidTimezones;

    expect(zones).toContain("America/Detroit");
});


test("zones by offset", () => {
    console.log(JSON.stringify(timezoneInfoList, null, 2));
    expect(timezoneInfoList).not.toBeNull()
});
