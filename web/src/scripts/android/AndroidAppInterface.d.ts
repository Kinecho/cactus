import {AndroidPurchaseResult} from "@shared/api/CheckoutTypes";

/**
 * Interface for calling native app functions
 */
declare interface AndroidAppInterface {
    showToast: (message: string) => void
    startCheckout: (androidProductId: string, memberId: string) => void
    handlePurchaseFulfilled: (purchaseToken: string, developerPayload?: string | undefined) => void
}



/**
 * Interface that maps to functions that the android app calls on the web app
 */
declare interface AndroidAppDelegateInterface {
    purchaseCompleted: (result: AndroidPurchaseResult) => void
}