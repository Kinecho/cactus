import Payment from "@shared/models/Payment";

export function getLatestGooglePayment(payments: Payment[]): Payment | undefined {
    if (payments.length === 0) {
        return undefined;
    }

    const sorted = payments.sort((a, b) => {
        const o1 = a.google?.orderId;
        const o2 = b.google?.orderId;
        if (o1 && o2) {
            return o2.localeCompare(o1);
        }
        if (a.updatedAt && b.updatedAt) {
            return +b.updatedAt - +a.updatedAt
        }

        return 0;
    });

    return sorted.shift();
}