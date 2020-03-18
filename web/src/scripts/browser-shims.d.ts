import {AndroidAppDelegateInterface, AndroidAppInterface} from "@web/android/AndroidAppInterface";

declare global {
    interface Window {
        Android?: AndroidAppInterface,
        AndroidDelegate?: AndroidAppDelegateInterface,
        androidCheckoutFinished?: (success: boolean, message?: string | undefined) => void
        branch: any,
        cloudsponge: any,

        [key: string]: any; // Add index signature
    }

    interface Navigator {
        share: (options: { title?: string, url?: string, text?: string }) => Promise<void | any>
    }


    interface FirebaseObject {
        [key: string]: any;
    }

    interface HTMLElement {
        __vueClickOutside__: EventListenerOrEventListenerObject | null
    }

    interface NodeModule {
        hot: any,
    }
}


