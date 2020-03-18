import {
    AndroidAppDelegateInterface,
    AndroidAppInterface,
    PurchaseCompleteParams
} from "@web/android/AndroidAppInterface";
import {stringifyJSON} from "@shared/util/ObjectUtil";
import {AndroidPurchaseResult} from "@shared/api/CheckoutTypes";
import Logger from "@shared/Logger";

export interface AndroidCheckoutDelegate {
    onCompleted: (result: AndroidPurchaseResult) => void
}

export default class AndroidService implements AndroidAppDelegateInterface {
    static shared = new AndroidService();
    logger = new Logger("AndroidService");
    api: AndroidAppInterface;
    public checkoutDelegate?: AndroidCheckoutDelegate;

    constructor() {
        this.api = window.Android!;
        window.AndroidDelegate = this;
    }

    get isReady(): boolean {
        return !!this.api
    }

    startCheckout(androidProductId: string, memberId: string) {
        this.api.startCheckout(androidProductId, memberId);
    }

    showToast(message: string) {
        this.api.showToast(message);
    }

    handlePurchaseFulfilled(params: PurchaseCompleteParams) {
        this.api.handlePurchaseFulfilled(stringifyJSON(params));
    }

    purchaseCompleted(result: AndroidPurchaseResult) {
        const {message, purchase, success} = result;
        this.logger.info("Android checkout finished with success = ", success, message, purchase);
        this.checkoutDelegate?.onCompleted(result)
    }

}