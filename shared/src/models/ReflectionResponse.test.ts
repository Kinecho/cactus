import ReflectionResponse, {
    ResponseMediumType
} from "@shared/models/ReflectionResponse";
import {setTimestamp} from "@shared/util/FirestoreUtil";
import * as firebase from "firebase";
import { AppType } from "@shared/types/DeviceTypes";
import { getResponseMedium, ResponseMedium } from "@shared/util/ReflectionResponseUtil";

beforeEach(() => {
    setTimestamp(firebase.firestore.Timestamp);
});

describe("reflectionDates json Decode conversions", () => {
    test("decodeJSON empty array", () => {
        const json = {reflectionDates: []};
        const model = new ReflectionResponse();
        model.decodeJSON(json);
        expect(model.reflectionDates).toHaveLength(0);
    });

    test("decodeJSON one date in array", () => {
        const d = new Date();
        const json = {reflectionDates: [d.getTime()]};
        const model = new ReflectionResponse();
        model.decodeJSON(json);
        expect(model.reflectionDates).toHaveLength(1);
        expect(model.reflectionDates[0]).toEqual(d);
    });

    test("decodeJSON multiple date in array", () => {
        const d = new Date();
        const d2 = new Date();
        d2.setFullYear(2011, 2, 3);
        const json = {reflectionDates: [d.getTime(), d2.getTime()]};
        const model = new ReflectionResponse();
        model.decodeJSON(json);
        expect(model.reflectionDates).toHaveLength(2);
        expect(model.reflectionDates[0]).toEqual(d);
        expect(model.reflectionDates[1]).toEqual(d2);
    });
});

describe("reflectionDates to firebase", () => {
    test("single date to firestore timestamp", () => {
        const model = new ReflectionResponse();
        const d = new Date();
        d.setFullYear(2019, 11, 5);
        model.reflectionDates.push(d);
        const data = model.toFirestoreData();

        const expectedTimestamp = firebase.firestore.Timestamp.fromDate(d);
        expect(data.reflectionDates[0]).not.toBeNull();
        expect(data.reflectionDates[0]).toEqual(expectedTimestamp);
    });

    test("multiple dates to firestore timestamp", () => {
        const model = new ReflectionResponse();
        const d = new Date();
        d.setFullYear(2019, 11, 5);

        const d2 = new Date();
        d2.setFullYear(2011, 2, 23);

        model.reflectionDates.push(d);
        model.reflectionDates.push(d2);
        const data = model.toFirestoreData();

        const ts1 = firebase.firestore.Timestamp.fromDate(d);
        const ts2 = firebase.firestore.Timestamp.fromDate(d2);
        expect(data.reflectionDates).toHaveLength(2);
        expect(data.reflectionDates[0]).not.toBeNull();
        expect(data.reflectionDates[0]).toEqual(ts1);
        expect(data.reflectionDates[1]).toEqual(ts2);
    })
});

describe("Add date log", () => {
    test("no dates in the log yet", () => {
        const model = new ReflectionResponse();
        const d = new Date()
        const added = model.addReflectionLog(d);
        expect(added).toBe(true)
        expect(model.reflectionDates).toHaveLength(1);
    });

    test("date already in the log", () => {
        const model = new ReflectionResponse();
        const d = new Date();
        model.reflectionDates.push(d);
        const added = model.addReflectionLog(d);
        expect(added).toBe(false);
        expect(model.reflectionDates).toHaveLength(1);
    });

    test("old date in the log", () => {
        const model = new ReflectionResponse();
        const oldDate = new Date();
        oldDate.setFullYear(2019, 11, 1);
        const currentDate = new Date();
        currentDate.setFullYear(2019, 11, 2);

        model.reflectionDates.push(oldDate);
        const added = model.addReflectionLog(currentDate);
        expect(added).toBe(true);
        expect(model.reflectionDates).toHaveLength(2);
    });

    test("date within 5 mins of threshold - 10 minutes threshold", () => {
        const model = new ReflectionResponse();
        const oldDate = new Date();
        oldDate.setFullYear(2019, 11, 1);
        oldDate.setHours(1, 0, 0, 0);

        const currentDate = new Date();
        currentDate.setFullYear(2019, 11, 1);
        currentDate.setHours(1, 5, 0, 0);

        model.reflectionDates.push(oldDate);
        const added = model.addReflectionLog(currentDate, 10);
        expect(added).toBe(false);
        expect(model.reflectionDates).toHaveLength(1);
    });

    test("date within 11 mins of threshold - 10 minutes threshold", () => {
        const model = new ReflectionResponse();
        const oldDate = new Date();
        oldDate.setFullYear(2019, 11, 1);
        oldDate.setHours(1, 0, 0, 0);

        const currentDate = new Date();
        currentDate.setFullYear(2019, 11, 1);
        currentDate.setHours(1, 11, 0, 0);

        model.reflectionDates.push(oldDate);
        const added = model.addReflectionLog(currentDate, 10);
        expect(added).toBe(true);
        expect(model.reflectionDates).toHaveLength(2);
    });

    test("date sandwiched between existing dates, within threshold - 10 minutes threshold", () => {
        const model = new ReflectionResponse();
        const oldDate = new Date();
        oldDate.setFullYear(2019, 11, 1);
        oldDate.setHours(1, 0, 0, 0);

        const oldDate2 = new Date();
        oldDate2.setFullYear(2019, 11, 1);
        oldDate2.setHours(1, 20, 0, 0);


        const currentDate = new Date();
        currentDate.setFullYear(2019, 11, 1);
        currentDate.setHours(1, 11, 0, 0);

        model.reflectionDates.push(oldDate, oldDate2);

        expect(model.addReflectionLog(currentDate, 10)).toBe(false);
        expect(model.reflectionDates).toHaveLength(2);

        //change the threshold
        expect(model.addReflectionLog(currentDate, 5)).toBe(true);
        expect(model.reflectionDates).toHaveLength(3);
    });
});

test("Get Response Medium for Type", () => {
    expect(getResponseMedium({app: AppType.ANDROID, type: ResponseMediumType.JOURNAL})).toEqual(ResponseMedium.JOURNAL_ANDROID);
    expect(getResponseMedium({app: AppType.WEB, type: ResponseMediumType.JOURNAL})).toEqual(ResponseMedium.JOURNAL_WEB);
    expect(getResponseMedium({app: AppType.ANDROID, type: ResponseMediumType.PROMPT})).toEqual(ResponseMedium.PROMPT_ANDROID);
    expect(getResponseMedium({app: AppType.IOS, type: ResponseMediumType.JOURNAL})).toEqual(ResponseMedium.JOURNAL_IOS);
    expect(getResponseMedium({app: AppType.IOS, type: ResponseMediumType.EMAIL})).toEqual(ResponseMedium.EMAIL);
    expect(getResponseMedium({app: AppType.ANDROID, type: ResponseMediumType.EMAIL})).toEqual(ResponseMedium.EMAIL);
})