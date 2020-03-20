import {AndroidPurchaseResult, AndroidRestorePurchaseResult} from "@shared/api/CheckoutTypes";


interface PurchaseCompleteParams {
    purchaseToken: string,

    /**
     * Can set this when acknowledging a purchase
     */
    developerPayload?: string | undefined
}

/**
 * Interface that maps to functions that the android app calls on the web app
 */
declare interface AndroidAppDelegateInterface {
    purchaseCompleted: (result: AndroidPurchaseResult) => void;
    handleRestoredPurchases: (restoredPurchases: AndroidRestorePurchaseResult ) => void;
}


/**
 * Interface for calling native app functions
 */
declare interface AndroidAppInterface {
    showToast: (message: string) => void
    startCheckout: (androidProductId: string, memberId: string) => void
    handlePurchaseFulfilled: (jsonString: string) => void
    restorePurchases: () => void
}