import {AndroidPurchaseResult} from "@shared/api/CheckoutTypes";


interface PurchaseCompleteParams {
    purchaseToken: string,
    developerPayload?: string | undefined
}

/**
 * Interface that maps to functions that the android app calls on the web app
 */
declare interface AndroidAppDelegateInterface {
    purchaseCompleted: (result: AndroidPurchaseResult) => void
}


/**
 * Interface for calling native app functions
 */
declare interface AndroidAppInterface {
    showToast: (message: string) => void
    startCheckout: (androidProductId: string, memberId: string) => void
    handlePurchaseFulfilled: (jsonString: string) => void
}