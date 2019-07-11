import {QueryParam} from "@shared/util/queryParams";
import {isValidEmail} from "@shared/util/StringUtil";
import Vue from "vue";
import NavBar from "@components/NavBar.vue";
import {configureDirectives} from "@web/vueDirectives";

export enum LocalStorageKey {
    emailForSignIn = 'emailForSignIn'
}


function createElementFromString(htmlString: string): ChildNode {
    const div = document.createElement('div');
    div.innerHTML = htmlString.trim();

    // Change this to div.childNodes to support multiple top-level nodes
    return div.firstChild as ChildNode;
}

function addModalCloseListener() {
    const buttons = <HTMLCollectionOf<HTMLButtonElement>>document.getElementsByClassName("modal-close");
    Array.from(buttons).forEach(button => {
        button.addEventListener("click", () => {
            const modalId = button.dataset.for;
            if (!modalId) {
                console.error("Unable to get modal as the modal ID was null");
                return;
            }
            const modal = <HTMLDivElement>document.getElementById(modalId);
            modal.classList.add("hidden");
            modal.classList.remove("open");
        })
    })
}

/**
 *
 * @param {string} modalId - the ID of the modal to close
 * @returns {boolean} success - if the modal was successfully closed
 */
export function closeModal(modalId: string): boolean {
    const modalDiv = <HTMLDivElement>document.getElementById(modalId);
    if (modalDiv) {
        modalDiv.classList.remove("open");
        return true;
    }
    return false;
}

export function showModal(modalId: string) {
    const modalDiv = <HTMLDivElement>document.getElementById(modalId);
    if (modalDiv) {
        modalDiv.classList.add("open");
        return true;
    }
    return false;
}

export interface ConfirmEmailResponse {
    canceled: boolean,
    email?: string,
}

export function showConfirmEmailModal(options: {
    title?: string,
    message?: string,
    error?: string,
    imageUrl?: string,
    imageAlt?: string,
    classNames?: string[]
}): Promise<ConfirmEmailResponse> {

    const modalId = "auth-confirm-modal";

    return new Promise(async (resolve, rejeect) => {

        const modal = addModal(modalId, {
            ...options,
            classNames: [...(options.classNames || []), "auth"],
            onClose: () => {
                resolve({canceled: true})
            }
        });

        // modal.child
        const $content = modal.getElementsByClassName("modal-content").item(0);
        if (!$content) {
            console.error("unable to create modal content");
            return;
        }
        const $emailInput = createElementFromString(`<input type="email" class="email-confirm" name="email" autocomplete="username" placeholder="Enter your email"/>`) as HTMLInputElement;
        // $emailInput.addEventListener("")

        const $inputContainer = document.createElement("div");
        $inputContainer.appendChild($emailInput);

        const $confirmButton = createElementFromString(`<button class="button confirm">Confirm</button>`);


        $content.appendChild($inputContainer);


        const $error = createElementFromString(`<div class="error hidden">${options.error || "Unable to sign in"}</div>`) as HTMLDivElement;
        $content.appendChild($error);

        if (options.error) {
            $error.classList.remove("hidden");
        }

        $content.appendChild($confirmButton);

        $confirmButton.addEventListener("click", () => {
            const email = $emailInput.value;
            const isValid = isValidEmail(email);
            if (!isValid) {
                $error.innerText = "Please enter a valid email";
                $error.classList.remove("hidden");
            } else {
                $error.classList.add("hidden");
                resolve({canceled: false, email});
                closeModal(modalId);
            }

        });


        showModal(modalId);

    })

}

export function addModal(modalId: string, options: {
    title?: string,
    message?: string,
    imageUrl?: string,
    imageAlt?: string,
    classNames?: string[],
    onClose?: () => void,
}): HTMLDivElement {

    const existingModal = <HTMLDivElement>document.getElementById(modalId);
    if (existingModal) {
        console.warn(`a modal with id ${modalId} already exists, removing it`);
        existingModal.remove()
    }

    const $button = createElementFromString(`<button title="Close" class="modal-close tertiary"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <path fill="#33CCAB" d="M13.8513053,12 L21.6125213,19.7612161 C22.1291596,20.2778543 22.1291596,21.0958831 21.6125213,21.6125213 C21.3643894,21.8606532 21.0334408,22 20.6868687,22 C20.3402966,22 20.009348,21.8606532 19.7612161,21.6125213 L12,13.8513053 L4.23878394,21.6125213 C3.99065203,21.8606532 3.65970345,22 3.31313131,22 C2.96655918,22 2.63561059,21.8606532 2.38747868,21.6125213 C1.87084044,21.0958831 1.87084044,20.2778543 2.38747868,19.7612161 L10.1486947,12 L2.38747868,4.23878394 C1.87084044,3.7221457 1.87084044,2.90411693 2.38747868,2.38747868 C2.90411693,1.87084044 3.7221457,1.87084044 4.23878394,2.38747868 L12,10.1486947 L19.7612161,2.38747868 C20.2778543,1.87084044 21.0958831,1.87084044 21.6125213,2.38747868 C22.1291596,2.90411693 22.1291596,3.7221457 21.6125213,4.23878394 L13.8513053,12 Z"/>
    </svg>
    </button>`);


    $button.addEventListener("click", () => {
        closeModal(modalId);
        if (options.onClose) {
            options.onClose();
        }
    });

    const $content = document.createElement("div");
    $content.classList.add("modal-content");
    $content.append($button);

    if (options.imageUrl) {
        const $illustration = createElementFromString(`<img src="${options.imageUrl}" alt="${options.imageAlt || ''}" />`);
        $content.append($illustration);
    }
    let $title = null;
    let $message = null;

    if (options.title) {
        $title = document.createElement("h2");
        $title.innerText = options.title;
        $content.append($title);
    }

    if (options.message) {
        $message = document.createElement("div");
        $message.innerText = options.message;
        $content.append($message);
    }

    const modal = document.createElement("div");
    modal.id = modalId;
    modal.classList.add("modal-window");
    if (options.classNames) {
        modal.classList.add(...options.classNames);
    }
    modal.appendChild($content);


    return document.body.appendChild(modal);
}


export function getQueryParam(name: QueryParam): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

export function triggerWindowResize() {
    const resizeEvent = window.document.createEvent('UIEvents');
    resizeEvent.initUIEvent('resize', true, false, window, 0);
    window.dispatchEvent(resizeEvent);
}

declare interface NavigationOptions {
    showSignupButton?: boolean,
    redirectOnSignOut?: boolean,
    signOutRedirectUrl?: string,
}

export function setupNavigation(options: NavigationOptions) {
    const $headers = document.getElementsByTagName("header");
    const $header = $headers ? $headers.item(0) : undefined;
    const $nav = document.getElementById("#top-nav");

    configureDirectives();

    if (!$nav && !$header) {
        console.warn("Can not find the Vue root element for the nav bar. Not initializing");
        return;
    }
    console.log("Found a navigation header, initializing");

    // @ts-ignore
    window.NavBar = new NavBar({
        el: $nav || $header,
        propsData: {
            showSignup: options.showSignupButton,
            redirectOnSignOut: options.redirectOnSignOut || false,
            signOutRedirectUrl: options.signOutRedirectUrl,
        },
        components: {NavBar: NavBar}
    });
}
