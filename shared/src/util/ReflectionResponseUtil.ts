import ReflectionResponse from "@shared/models/ReflectionResponse";
import {getStreak} from "@shared/util/DateUtil";
import {createElementAccumulation, ElementAccumulation} from "@shared/models/ElementAccumulation";
import {CactusElement} from "@shared/models/CactusElement";


export function calculateStreak(reflections: ReflectionResponse[], options: { start?: Date | undefined, timeZone?: string } = {}): number {
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

    return getStreak({dates, start, timeZone});
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