import Logger from "@shared/Logger";
import {Config} from "@web/config";
import {AppType} from "@shared/models/ReflectionResponse";
import {getValidTimezoneName} from "@shared/timezones";

export const MOBILE_BREAKPOINT_PX = 600;
const logger = new Logger("DeviceUtil");

export function getDeviceDimensions(): { height: number, width: number } {
    const height = window.innerHeight;
    const width = window.innerWidth;

    return {height, width};

}

export function isPreRender(): boolean {
    return getUserAgent() === "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/61.0.3159.5 Safari/537.36 Prerender (+https://github.com/prerender/prerender)";
}

export function getDeviceTimeZone(): string | undefined {
    try {
        const deviceTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const validTimezone = getValidTimezoneName(deviceTimeZone);
        logger.info(`Device Timezone = '${deviceTimeZone}'. Converted to valid timezone = '${validTimezone}'`);
        return validTimezone
    } catch (e) {
        logger.error("Unable to fetch timezone from device. The 'Intl' API may not be supported");
        return undefined
    }
}

export function getDeviceLocale(): string | undefined {
    try {
        const locale = Intl.DateTimeFormat().resolvedOptions().locale;
        logger.info("device locale", locale);
        return locale;
    } catch (e) {
        logger.error("Unable to fetch timezone from device. The 'Intl' API may not be supported");
    }
}

export function getUserAgent(): string {
    return navigator.userAgent
}

export function isAndroidDevice(): boolean {
    const expression = new RegExp("android", "i");
    return expression.test(getUserAgent());
}

export function isIosDevice(): boolean {
    return /iPad|iPhone|iPod/.test(getUserAgent()) && !window.MSStream;
}

export function isAndroidApp(): boolean {
    return navigator.userAgent === Config.androidUserAgent;
}

export function getAppType(): AppType {
    if (isAndroidApp()) {
        return AppType.ANDROID
    }
    return AppType.WEB;
}