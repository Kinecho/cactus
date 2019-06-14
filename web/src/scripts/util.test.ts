import {validateEmail} from "@web/util";

describe("validateEmail Test", () => {
    test("valid, standard email", () => {
        expect(validateEmail("neil@kinecho.com")).toBeTruthy()
    })

    test("valid, standard email", () => {
        expect(validateEmail("neil+test@kinecho.com")).toBeTruthy()
    })
})