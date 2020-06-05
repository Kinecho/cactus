export interface CheckoutInfo {
    success?: boolean,
    loading?: boolean,
    error?: string | null,
}

export enum PageStatus {
    success = "success",
    canceled = "canceled",
}