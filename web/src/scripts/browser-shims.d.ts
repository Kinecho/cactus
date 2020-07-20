import { AndroidAppDelegateInterface, AndroidAppInterface } from "@web/android/AndroidAppInterface";
import { IosDelegate } from "@web/ios/IosAppTypes";
import { IosAppInterface } from "@web/ios/IosAppService";

interface VisualViewportEventMap {
    "resize": UIEvent;
    "scroll": Event;
}

interface VisualViewport extends EventTarget {
    readonly height: number;
    readonly offsetLeft: number;
    readonly offsetTop: number;
    onresize: ((this: VisualViewport, ev: UIEvent) => any) | null;
    onscroll: ((this: VisualViewport, ev: Event) => any) | null;
    readonly pageLeft: number;
    readonly pageTop: number;
    readonly scale: number;
    readonly width: number;

    addEventListener<K extends keyof VisualViewportEventMap>(type: K, listener: (this: VisualViewport, ev: VisualViewportEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;

    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;

    removeEventListener<K extends keyof VisualViewportEventMap>(type: K, listener: (this: VisualViewport, ev: VisualViewportEventMap[K]) => any, options?: boolean | EventListenerOptions): void;

    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

declare var VisualViewport: {
    prototype: VisualViewport;
    new(): VisualViewport;
};


declare global {
    interface Window {
        Android?: AndroidAppInterface,
        AndroidDelegate?: AndroidAppDelegateInterface,
        androidCheckoutFinished?: (success: boolean, message?: string | undefined) => void
        branch: any,
        cloudsponge: any;
        CactusIosDelegate?: IosDelegate;
        readonly visualViewport?: VisualViewport;

        webkit?: {
            messageHandlers?: {} & IosAppInterface
        }
        [key: string]: any; // Add index signature
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


