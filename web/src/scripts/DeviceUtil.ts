export const MOBILE_BREAKPOINT_PX = 600;

export function getDeviceDimensions(): { height: number, width: number } {
    const height = window.innerHeight;
    const width = window.innerWidth;

    return {height, width};

}

export function getDeviceTimeZone(): string | undefined {
    try {
        const timezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;
        console.log("device timezoneName", timezoneName);
        return timezoneName
    } catch (e) {
        console.error("Unable to fetch timezone from device. The 'Intl' API may not be supported");
    }
}

export function getDeviceLocale(): string | undefined {
    try {
        const locale = Intl.DateTimeFormat().resolvedOptions().locale;
        console.log("device locale", locale);
        return locale;
    } catch (e) {
        console.error("Unable to fetch timezone from device. The 'Intl' API may not be supported");
    }
}