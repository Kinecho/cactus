import {validateEmail} from "@web/util";

describe("validateEmail Test", () => {
    test("valid, standard email", () => {
        expect(validateEmail("neil@kinecho.com")).toBeTruthy()
    })
})