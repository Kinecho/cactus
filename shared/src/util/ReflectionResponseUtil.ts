import ReflectionResponse, { ResponseMediumType } from "@shared/models/ReflectionResponse";
import { getStreakDays, getStreakMonths, getStreakWeeks } from "@shared/util/DateUtil";
import { createElementAccumulation, ElementAccumulation } from "@shared/models/ElementAccumulation";
import { CactusElement } from "@shared/models/CactusElement";
import { AppType } from "@shared/types/DeviceTypes";

export interface StreakResult {
    dayStreak: number,
    weekStreak: number,
    monthStreak: number
}

export function calculateStreaks(reflections: ReflectionResponse[], options: { start?: Date | undefined, timeZone?: string } = {}): StreakResult {
    const {start, timeZone} = options;
    const unsortedDates: Date[] = [];
    // const dates = reflections.filter(r => !!r.createdAt).map(r => r.createdAt) as Date[];

    reflections.forEach(r => {
        unsortedDates.push(...r.reflectionDates);
        if (r.createdAt) {
            unsortedDates.push(r.createdAt);
        }
        if (r.updatedAt) {
            unsortedDates.push(r.updatedAt);
        }
    });

    const dates = unsortedDates.sort((a, b) => b.getTime() - a.getTime());

    const dayStreak = getStreakDays({dates, start, timeZone});
    const weekStreak = getStreakWeeks({dates, start, timeZone});
    const monthStreak = getStreakMonths({dates, start, timeZone});

    return {
        dayStreak: dayStreak,
        weekStreak: weekStreak,
        monthStreak: monthStreak
    }
}

export function calculateDurationMs(reflections: ReflectionResponse[]): number {
    return reflections.reduce((total, r) => {
        return total + (r.reflectionDurationMs || 0)
    }, 0)
}

export function getElementAccumulationCounts(reflections: ReflectionResponse[]): ElementAccumulation {
    const initial: ElementAccumulation = createElementAccumulation();

    // const reflections = await this.getAllReflections();
    return reflections.reduce((current, reflection) => {
        if (reflection.cactusElement && reflection.cactusElement in CactusElement) {
            current[reflection.cactusElement] += 1
        }

        return current
    }, initial)
}

export enum ResponseMedium {
    EMAIL = "EMAIL",
    PROMPT_WEB = "PROMPT_WEB",
    PROMPT_IOS = "PROMPT_IOS",
    PROMPT_ANDROID = "PROMPT_ANDROID",
    JOURNAL_WEB = "JOURNAL_WEB",
    JOURNAL_IOS = "JOURNAL_IOS",
    JOURNAL_ANDROID = "JOURNAL_ANDROID"
}

export function getAppTypeFromResponseMedium(medium?: ResponseMedium | null): AppType | undefined {
    let appType: AppType | undefined;

    switch (medium) {
        case ResponseMedium.EMAIL:
            appType = AppType.WEB
            break;
        case ResponseMedium.PROMPT_ANDROID:
        case ResponseMedium.JOURNAL_ANDROID:
            appType = AppType.ANDROID;
            break;
        case ResponseMedium.PROMPT_WEB:
        case ResponseMedium.JOURNAL_WEB:
            appType = AppType.WEB;
            break;
        case ResponseMedium.JOURNAL_IOS:
        case ResponseMedium.PROMPT_IOS:
            appType = AppType.IOS
            break;
    }

    return appType;
}

export function getResponseMedium(options: { type: ResponseMediumType, app: AppType }): ResponseMedium {
    switch (options.type) {
        case ResponseMediumType.PROMPT:
        case ResponseMediumType.JOURNAL:
            return `${ options.type }_${ options.app }` as ResponseMedium;
        case ResponseMediumType.EMAIL:
            return ResponseMedium.EMAIL;
    }
}

export function isJournal(medium?: ResponseMedium): boolean {
    return medium && [ResponseMedium.JOURNAL_ANDROID, ResponseMedium.JOURNAL_IOS, ResponseMedium.JOURNAL_WEB].includes(medium) || false;
}

export function getResponseMediumDisplayName(medium?: ResponseMedium | string): string {
    if (!medium) {
        return "Unknown";
    }
    let displayName: string;
    switch (medium) {
        case ResponseMedium.EMAIL:
            displayName = "Email";
            break;
        case ResponseMedium.JOURNAL_WEB:
            displayName = "Journal Web";
            break;
        case ResponseMedium.JOURNAL_IOS:
            displayName = "Journal iOS";
            break;
        case ResponseMedium.JOURNAL_ANDROID:
            displayName = "Journal Android";
            break;
        case ResponseMedium.PROMPT_WEB:
            displayName = "Prompt Web";
            break;
        case ResponseMedium.PROMPT_IOS:
            displayName = "Prompt iOS";
            break;
        case ResponseMedium.PROMPT_ANDROID:
            displayName = "Prompt Android";
            break;
        default:
            displayName = "Unknown";
            break;
    }
    return displayName;
}

export function getAppEmoji(app?: AppType): string {
    if (!app) {
        return ":question:"
    }

    switch (app) {
        case AppType.WEB:
            return ":computer:";
        case AppType.ANDROID:
            return ":android:";
        case AppType.IOS:
            return ":ios:";
        default:
            return ":question:";
    }
}

export function getResponseMediumSlackEmoji(medium?: ResponseMedium): string {
    if (!medium) {
        return "Unknown";
    }
    let displayName: string;
    switch (medium) {
        case ResponseMedium.EMAIL:
            displayName = ":email:";
            break;
        case ResponseMedium.JOURNAL_WEB:
        case ResponseMedium.PROMPT_WEB:
            displayName = ":computer:";
            break;
        case ResponseMedium.JOURNAL_IOS:
        case ResponseMedium.PROMPT_IOS:
            displayName = ":ios:";
            break;
        case ResponseMedium.JOURNAL_ANDROID:
        case ResponseMedium.PROMPT_ANDROID:
            displayName = ":android:";
            break;
        default:
            displayName = `Unknown (${ medium })`;
            break;
    }
    return displayName;
}