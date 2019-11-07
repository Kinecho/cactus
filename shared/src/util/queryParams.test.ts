import {
    includesLandingQueryParams
} from "@shared/util/queryParams";

describe("check if params include expected landing query ones", () => {
    test("does not include landing query params", () => {
        const params = { "some_other_key": "test_value" }
        expect(includesLandingQueryParams(params)).toEqual(false);
    });

    test("does include landing query params", () => {
        const paramsSource = { "utm_source": "test_source" }
        expect(includesLandingQueryParams(paramsSource)).toEqual(true);

        const paramsRef = { "ref": "test@cactus.app" }
        expect(includesLandingQueryParams(paramsRef)).toEqual(true);
    });
});