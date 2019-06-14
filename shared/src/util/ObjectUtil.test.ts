import {isArray, isNull, isNonEmptyObject, transformObject, isDate} from "@shared/util/ObjectUtil";
import * as firebase from "firebase";
import Timestamp = firebase.firestore.Timestamp;

describe("isObject", () => {
    test("string input", () => {
        expect(isNonEmptyObject("string")).toBeFalsy()
    });

    test("number input", () => {
        expect(isNonEmptyObject(7)).toBeFalsy()
    });

    test("empty array input", () => {
        expect(isNonEmptyObject([])).toBeFalsy()
    });

    test("non-empty array input", () => {
        expect(isNonEmptyObject([1])).toBeFalsy()
    });

    test("empty object input", () => {
        expect(isNonEmptyObject({})).toBeFalsy()
    });

    test("non object input", () => {
        expect(isNonEmptyObject({test: "value"})).toBeTruthy()
    });

    test("null", () => {
        expect(isNonEmptyObject(null)).toBeFalsy()
    });

    test("undefined", () => {
        expect(isNonEmptyObject(undefined)).toBeFalsy()
    });

    test("Date", () => {
        expect(isNonEmptyObject(new Date() )).toBeFalsy()
    });

    test("firebase.Timestamp", () => {
        expect(isNonEmptyObject(firebase.firestore.Timestamp.now())).toBeTruthy()
    })
});

describe("isArray", () => {
    test("string input", () => {
        expect(isArray("string")).toBeFalsy()
    });

    test("number input", () => {
        expect(isArray(7)).toBeFalsy()
    });

    test("empty array input", () => {
        expect(isArray([])).toBeTruthy()
    });

    test("non-empty array input", () => {
        expect(isArray([1])).toBeTruthy()
    });

    test("empty object input", () => {
        expect(isArray({})).toBeFalsy()
    });

    test("null", () => {
        expect(isArray(null)).toBeFalsy()
    });

    test("undefined", () => {
        expect(isArray(undefined)).toBeFalsy()
    });
});

describe("isNull", () => {
   test("null", () => {
       expect(isNull(null)).toBeTruthy();
   });

   test("undefined", () => {
        expect(isNull(undefined)).toBeTruthy();
   });
});

describe("isDate", () => {
    test("null", () => {
        expect(isDate(null)).toBeFalsy();
    });

    test("undefined", () => {
        expect(isDate(undefined)).toBeFalsy();
    });

    test("Date", () => {
        expect(isDate(new Date())).toBeTruthy();
    });
    test("string", () => {
        expect(isDate("string")).toBeFalsy();
    });

    test("number", () => {
        expect(isDate(1234)).toBeFalsy();
    });

});

describe("transform object", () => {
    test("null", async () => {
        expect(await transformObject(null, async (value) => value)).toBeNull()
    });

    test("plain object, no transformation", async () => {
        let transform = jest.fn(async (value:any) => {
            //none
            return value;
        });

        expect(await transformObject({}, transform)).toEqual({});
        expect(transform).toHaveBeenCalledTimes(1)
    });

    test("single entry object", async () => {
        let transform = jest.fn(async (value:any) => {
            //none
            return value;
        });
        const input = {key: "value"};
        expect(await transformObject(input, transform)).toEqual(input);
        expect(transform).toHaveBeenCalledTimes(3)
    });

    test("single entry array", async () => {
        let transform = jest.fn(async (value:any) => {
            //none
            return value;
        });
        const input = [{key: "value"}];
        expect(await transformObject(input, transform)).toEqual(input);
        expect(transform).toHaveBeenCalledTimes(3)
    });

    test("nested object", async () => {
        let transform = jest.fn(async (value:any) => {
            //none
            return value;
        });
        const input = {key: "value", nested: {one: 1}};
        expect(await transformObject(input, transform)).toEqual(input);
        expect(transform).toHaveBeenCalledTimes(7)
    });

    test("nested object with array", async () => {
        let transform = jest.fn(async (value:any) => {
            //none
            return value;
        });
        const input = {key: "value", nested: {one: 1, two: [{three: 3}]}};
        expect(await transformObject(input, transform)).toEqual(input);
        expect(transform).toHaveBeenCalledTimes(11)
    });

    test("nested object with array and a transform", async () => {
        let transform = jest.fn(async (value:any) => {
            //none
            if (value === 1){
                return 2;
            }


            return value;
        });
        const input = {key: "value", nested: {one: 1, two: [{three: 3}]}};

        const output = {key: "value", nested: {one: 2, two: [{three: 3}]}};

        expect(await transformObject(input, transform)).toEqual(output);
        expect(transform).toHaveBeenCalledTimes(10)
    });

    test("nested object with array and a transform to null", async () => {
        let transform = jest.fn((value:any) => {
            //none
            if (value === 1){
                return null;
            }

            return value;
        });
        const input = {key: "value", two: null, nested: {one: 1, two: [{three: 3}]}};

        const output = {key: "value", two: null, nested: {one: null, two: [{three: 3}]}};

        expect(await transformObject(input, transform)).toEqual(output);
        expect(transform).toHaveBeenCalledTimes(12)
    });

    test("nested object with array and a transform to array", async () => {
        let transform = jest.fn((value:any) => {
            //none
            if (value === 1){
                return [1,2,3,4];
            }

            return value;
        });
        const input = {key: "value", two: null, nested: {one: 1, two: [{three: 3}]}};

        const output = {key: "value", two: null, nested: {one: [1,2,3,4], two: [{three: 3}]}};

        expect(await transformObject(input, transform)).toEqual(output);
        expect(transform).toHaveBeenCalledTimes(12)
    });

    test("nested object - date to Timestamp", async () => {

        const date = new Date(1548084587000);
        const timestamp = Timestamp.fromDate(date);

        let transform = jest.fn((value:any) => {
            if (isDate(value) ){
                return firebase.firestore.Timestamp.fromDate(value);
            }

            return value;
        });
        const input = {key: "value", two: null, nested: {date: date, two: [{three: 3}]}};

        const output = {key: "value", two: null, nested: {date: timestamp, two: [{three: 3}]}};

        expect(await transformObject(input, transform)).toEqual(output);
        expect(transform).toHaveBeenCalledTimes(12)
    });

    test("array object - date to Timestamp", async () => {

        const date = new Date(1548084587000);
        const timestamp = Timestamp.fromDate(date);

        let transform = jest.fn(async (value:any) => {
            if (isDate(value) ){
                return firebase.firestore.Timestamp.fromDate(value);
            }

            return value;
        });
        const input = [{date: date}, {date}];

        const output = [{date: timestamp}, {date: timestamp}];

        const result = await transformObject(input, transform);
        expect(result).toEqual(output);
        expect(transform).toHaveBeenCalledTimes(4)
    });

    test("array object - date to Timestamp, mixed type array", async () => {

        const date = new Date(1548084587000);
        const timestamp = Timestamp.fromDate(date);

        let transform = jest.fn(async (value:any) => {
            if (isDate(value) ){
                return firebase.firestore.Timestamp.fromDate(value);
            }

            return value;
        });
        const input = [{date: date}, {date}, 1, {nothing: "todo"}, date];

        const output = [{date: timestamp}, {date: timestamp}, 1, {nothing: "todo"}, timestamp];

        const result = await transformObject(input, transform);
        expect(result).toEqual(output);
        expect(transform).toHaveBeenCalledTimes(9)
    });
});