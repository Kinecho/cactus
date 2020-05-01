import { getQueryParam, RGBToHex } from "@web/util";
import { QueryParam } from "@shared/util/queryParams";


const jest = require("jest");
import { mockFirebase, mockauth } from "@test/jestsetup";

jest.mock("@web/auth", () => {
    return {
        logout: () => undefined,
    }
});

jest.mock("@web/firebase", () => {
    return {
        getAuth: () => mockauth,
        initializeFirebase: () => mockFirebase
    };
});

describe("getQueryParam", () => {
    test("getQueryParam - not encoded properly ", () => {
        const url = "/prompts/nIVmhvgppLNgNMAsWEb0?e=scottrocher+test082019@gmail.com";
        window.history.pushState({}, 'Test Title', url);

        expect(getQueryParam(QueryParam.EMAIL)).toEqual("scottrocher test082019@gmail.com")
    });

    test("getQueryParam - encoded query param", () => {
        const url = "/prompts/nIVmhvgppLNgNMAsWEb0?e=scottrocher%2Btest082019%40gmail.com";
        console.log("encodedComponent", url);
        window.history.pushState({}, 'Test Title', url);

        expect(getQueryParam(QueryParam.EMAIL)).toEqual("scottrocher+test082019@gmail.com")
    });

});

describe('RGBToHex', function () {
    test("rgb values", () => {
        expect(RGBToHex("rgb(255,255,255)")).toEqual("#ffffff")
        expect(RGBToHex("rgba(255,255,255,1)")).toEqual("#ffffff")
    })
});