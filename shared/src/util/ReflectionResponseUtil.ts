import ReflectionResponse from "@shared/models/ReflectionResponse";
import {getStreakDays, getStreakWeeks, getStreakMonths} from "@shared/util/DateUtil";
import {createElementAccumulation, ElementAccumulation} from "@shared/models/ElementAccumulation";
import {CactusElement} from "@shared/models/CactusElement";

interface StreakResult {
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