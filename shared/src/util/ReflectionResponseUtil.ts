import ReflectionResponse from "@shared/models/ReflectionResponse";
import {getStreak} from "@shared/util/DateUtil";


export function calculateStreak(reflections: ReflectionResponse[], start?: Date|undefined): number {
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

    return getStreak(dates, start);
}