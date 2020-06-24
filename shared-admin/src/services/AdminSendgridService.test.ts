import { EmailData, Helpers } from "@admin/services/AdminSendgridService";

describe("Get email address string from data object", () => {
    test("String email", () => {
        const data = "neil@cactus.app";
        const email = Helpers.getEmailAddressFromEmailData(data);
        expect(email).toEqual("neil@cactus.app");
    })

    test("undefined email", () => {
        const data = undefined;
        const email = Helpers.getEmailAddressFromEmailData(data);
        expect(email).toBeUndefined();
    })
    test("Email Object", () => {
        const data: EmailData = { email: "neil@cactus.app", name: "Neil Poulin" };
        const email = Helpers.getEmailAddressFromEmailData(data);
        expect(email).toEqual("neil@cactus.app");
    })

    test("Array of Email Object", () => {
        const data: EmailData[] = [{ email: "neil@cactus.app", name: "Neil Poulin" }];
        const email = Helpers.getEmailAddressFromEmailData(data);
        expect(email).toEqual("neil@cactus.app");
    })

    test("Array of string", () => {
        const data: EmailData[] = ["neil@cactus.app"];
        const email = Helpers.getEmailAddressFromEmailData(data);
        expect(email).toEqual("neil@cactus.app");
    })

})