import {getLatestGooglePayment} from "@shared/util/PaymentUtil";
import Payment from "@shared/models/Payment";

describe("Sort google payments", () => {
    const withOrderId = (orderId: string | undefined, updatedAt: Date = new Date("2020-02-01")): Payment => {
        const p1 = new Payment();
        p1.updatedAt = updatedAt;
        p1.memberId = "123";
        p1.google = {
            orderId: orderId,
            token: "mytoken",
            packageName: "app.cactus.stage",
            subscriptionPurchase: undefined,
            purchaseTime: 111111,
            subscriptionProductId: "product_1"
        };
        return p1;
    };

    test("no payments", () => {
        expect(getLatestGooglePayment([])).toBeUndefined();
    });

    test("single payment", () => {
        const p1 = withOrderId("google_GPA.3356-5487-5798-14529..0");
        expect(getLatestGooglePayment([p1])).toBe(p1);
    });

    test("two payment with order ids", () => {
        const p1 = withOrderId("google_GPA.3356-5487-5798-14529..0");
        const p2 = withOrderId("google_GPA.3356-5487-5798-14529");
        expect(getLatestGooglePayment([p1, p2])).toBe(p1);
        expect(getLatestGooglePayment([p2, p1])).toBe(p1);
    });

    test("two payment with order ids", () => {
        const p1 = withOrderId("google_GPA.3356-5487-5798-14529..0");
        const p2 = withOrderId("google_GPA.3356-5487-5798-14529");
        const p3 = withOrderId("google_GPA.3356-5487-5798-14529..1");
        expect(getLatestGooglePayment([p1, p2, p3])).toBe(p3);
        expect(getLatestGooglePayment([p2, p3, p1])).toBe(p3);
        expect(getLatestGooglePayment([p3, p2, p1])).toBe(p3);
    });

    test("two payment with updatedAts", () => {
        const p1 = withOrderId(undefined, new Date("2020-01-04"));
        const p2 = withOrderId(undefined, new Date("2020-01-02"));
        const p3 = withOrderId(undefined, new Date("2020-01-03"));
        expect(getLatestGooglePayment([p1, p2, p3])).toBe(p1);
        expect(getLatestGooglePayment([p2, p3, p1])).toBe(p1);
        expect(getLatestGooglePayment([p3, p2, p1])).toBe(p1);
    });
});