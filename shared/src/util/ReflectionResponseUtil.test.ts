import {calculateStreak, getElementAccumulationCounts} from "@shared/util/ReflectionResponseUtil";
import ReflectionResponse from "@shared/models/ReflectionResponse";
import {minusDays, minusHours, plusDays, plusHours} from "@shared/util/DateUtil";
import {CactusElement} from "@shared/models/CactusElement";

describe("calculate streak", () => {
    test("no reflections", () => {
        const streak = calculateStreak([]);
        expect(streak).toEqual(0);
    });

    test("one reflection, no reflectionDate log", () => {
        const r1 = new ReflectionResponse();

        r1.createdAt = new Date();
        r1.updatedAt = new Date();

        const streak = calculateStreak([r1]);
        expect(streak).toEqual(1);
    });

    test("one reflection, with 2 current dates in the reflectionDate log, 1 day streak", () => {
        const r1 = new ReflectionResponse();
        const created = new Date();
        created.setFullYear(2019, 11, 5);
        created.setHours(12, 0, 0, 0);

        const current = new Date();
        current.setFullYear(2019, 11, 6)
        current.setHours(12, 0, 0, 0);

        r1.createdAt = created;
        r1.updatedAt = created;


        const d1 = plusHours(1, created);
        r1.reflectionDates.push(d1);

        const streak = calculateStreak([r1], current);
        expect(streak).toEqual(1);
    });

    test("one reflection, with 2 current dates in the reflectionDate log, 2 day streak", () => {
        const r1 = new ReflectionResponse();
        const created = new Date();
        created.setFullYear(2019, 11, 5);
        created.setHours(12, 0, 0, 0);

        const current = new Date();
        current.setFullYear(2019, 11, 6);
        current.setHours(12, 0, 0, 0);

        r1.createdAt = created;
        r1.updatedAt = created;


        const d1 = plusDays(1, created);
        r1.reflectionDates.push(d1);

        const streak = calculateStreak([r1], current);
        expect(streak).toEqual(2);
    });


    test("4 days in log, plus created date", () => {
        const r1 = new ReflectionResponse();
        const created = new Date();
        created.setFullYear(2019, 11, 5);
        created.setHours(12, 0, 0, 0);


        r1.createdAt = created;
        r1.updatedAt = created;

        //4 days in the log,
        const d1 = plusDays(1, created);
        const d2 = plusDays(2, created);
        const d3 = plusDays(3, created);
        const d4 = plusDays(4, created);


        r1.reflectionDates.push(d1, d2, d3, d4);

        const current = plusHours(4, d4);

        const streak = calculateStreak([r1], current);
        expect(streak).toEqual(5);
    });

    test("4 days in log, plus created date plus updated date", () => {
        const r1 = new ReflectionResponse();
        const created = new Date();
        created.setFullYear(2019, 11, 5);
        created.setHours(12, 0, 0, 0);


        r1.createdAt = created;
        r1.updatedAt = minusDays(1, created);

        //4 days in the log,
        const d1 = plusDays(1, created);
        const d2 = plusDays(2, created);
        const d3 = plusDays(3, created);
        const d4 = plusDays(4, created);

        r1.reflectionDates.push(d1, d2, d3, d4);

        const current = plusHours(4, d4);

        const streak = calculateStreak([r1], current);
        expect(streak).toEqual(6);
    });

    test("4 non-unique days in log, plus created date plus updated date", () => {
        const r1 = new ReflectionResponse();
        const created = new Date();
        created.setFullYear(2019, 11, 5);
        created.setHours(12, 0, 0, 0);


        r1.createdAt = created;
        r1.updatedAt = minusHours(1, minusDays(1, created));

        //4 days in the log,
        const d1 = plusDays(1, created);
        const d2a = plusHours(2, plusDays(2, created));
        const d2b = plusHours(4, plusDays(2, created));
        const d4 = plusDays(4, created);

        r1.reflectionDates.push(d1, d2a, d2b, d4);

        //current date is d4, there is only one preceeding
        expect(calculateStreak([r1], plusHours(4, d4))).toEqual(1);

        //current date is the created date
        expect(calculateStreak([r1], created)).toEqual(2);
    });

    test("multiple reflections with various dates", () => {
        const r1 = new ReflectionResponse();
        const r2 = new ReflectionResponse();

        const d1 = new Date(); //1
        d1.setFullYear(2019, 11, 5);
        d1.setHours(12, 0, 0, 0);

        const d2 = plusDays(1, d1);
        const d3 = plusDays(2, d1);
        const d4 = plusDays(3, d1);
        const d5 = plusDays(4, d1);
        const d6 = plusDays(5, d1);
        const d7 = plusDays(6, d1);

        r1.createdAt = d1;
        r1.reflectionDates.push(d2, d3);
        r1.updatedAt = d4;

        r2.createdAt = d4;
        r2.updatedAt = d5;
        r2.reflectionDates.push(d6, d7);

        const current = plusHours(4, d7);

        const streak = calculateStreak([r1, r2], current);
        expect(streak).toEqual(7);
    });
});

describe("Get Element Accumulation Counts", () => {
    test("valid counts", () => {

        const r1 = new ReflectionResponse();
        r1.cactusElement = CactusElement.energy;

        const r2 = new ReflectionResponse();
        r2.cactusElement = CactusElement.meaning;

        const reflections: ReflectionResponse[] = [r1, r2];
        const result = getElementAccumulationCounts(reflections);

        expect(result).toEqual({
            [CactusElement.meaning]: 1,
            [CactusElement.energy]: 1,
            [CactusElement.emotions]: 0,
            [CactusElement.experience]: 0,
            [CactusElement.relationships]: 0,
        });
    })

    test("forced invalid count", () => {

        const r1 = new ReflectionResponse();
        r1.cactusElement = CactusElement.energy;

        const r2 = new ReflectionResponse();
        r2.cactusElement = "4" as CactusElement; //force

        const reflections: ReflectionResponse[] = [r1, r2];
        const result = getElementAccumulationCounts(reflections);

        expect(result).toEqual({
            [CactusElement.meaning]: 0,
            [CactusElement.energy]: 1,
            [CactusElement.emotions]: 0,
            [CactusElement.experience]: 0,
            [CactusElement.relationships]: 0,
        });
    })
});