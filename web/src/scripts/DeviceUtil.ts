import Logger from "@shared/Logger";
import {Config} from "@web/config";
import {AppType} from "@shared/models/ReflectionResponse";

export const MOBILE_BREAKPOINT_PX = 600;
const logger = new Logger("DeviceUtil");

export function getDeviceDimensions(): { height: number, width: number } {
    const height = window.innerHeight;
    const width = window.innerWidth;

    return {height, width};

}

export function getDeviceTimeZone(): string | undefined {
    try {
        const timezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;
        logger.info("device timezoneName", timezoneName);
        return timezoneName
    } catch (e) {
        logger.error("Unable to fetch timezone from device. The 'Intl' API may not be supported");
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

export function isAndroidApp(): boolean {
    return navigator.userAgent === Config.androidUserAgent;
}

export function getAppType(): AppType {
    if (isAndroidApp()) {
        return AppType.ANDROID
    }
    return AppType.WEB;
}