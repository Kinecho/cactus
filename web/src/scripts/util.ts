import {QueryParam} from "@shared/util/queryParams";
import {isValidEmail} from "@shared/util/StringUtil";
import NavBar from "@components/NavBar.vue";
import * as qs from "qs";


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

export function handleDatabaseError(error: { title?: string, message?: string, error: any }) {
    const timestamp = (new Date()).getTime();
    const id = `error-${timestamp}`;
    addModal(id, {title: error.title, message: error.message || "Something unexpected occurred."});
    showModal(id);
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
        const $form = document.createElement("form");
        $form.appendChild($inputContainer);

        $inputContainer.appendChild($emailInput);

        const $confirmButton = createElementFromString(`<button class="button confirm">Confirm</button>`);

        $form.appendChild($inputContainer);
        $form.appendChild($confirmButton);
        $content.appendChild($form);

        function onFormSubmit() {
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
        }

        $form.onsubmit = (e) => {
            e.preventDefault();
            onFormSubmit()
        };

        const $error = createElementFromString(`<div class="error hidden">${options.error || "Unable to sign in"}</div>`) as HTMLDivElement;
        $content.appendChild($error);

        if (options.error) {
            $error.classList.remove("hidden");
        }


        $confirmButton.addEventListener("click", () => {
            onFormSubmit();
        });


        showModal(modalId);
        $emailInput.focus();

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

    const $button = createElementFromString(`<button title="Close" class="modal-close tertiary icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" width="18" height="18"><path fill="#33ccab" d="M8.414 7l5.293 5.293a1 1 0 0 1-1.414 1.414L7 8.414l-5.293 5.293a1 1 0 1 1-1.414-1.414L5.586 7 .293 1.707A1 1 0 1 1 1.707.293L7 5.586 12.293.293a1 1 0 0 1 1.414 1.414L8.414 7z"/></svg>
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

export function getAllQueryParams(): { [name: string]: string } | undefined {
    try {
        return qs.parse(window.location.search, {
            ignoreQueryPrefix: true
        });
    } catch (e) {
        console.error("browser does not support url params", e);
        return;
    }
}

export function getQueryParam(name: QueryParam): string | null {
    try {
        const params = qs.parse(window.location.search, {
            ignoreQueryPrefix: true
        });


        return params[name];
        // return params.get(name);
    } catch (e) {
        console.error("browser does not support url params", e);
        return null;
    }

}

export function removeQueryParam(name: QueryParam) {
    try {
        const params = qs.parse(window.location.search, {ignoreQueryPrefix: true});
        if (params) {
            console.log("before removal query params;", qs.stringify(params));
            delete params[name];
            const updatedQs = qs.stringify(params);
            console.log("updated params", updatedQs);
            const newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + (updatedQs ? `?${updatedQs}` : "");
            window.history.pushState({path: newurl}, '', newurl);

        }
    } catch (e) {
        console.error("Error removing query param", e);
    }

}

export function updateQueryParam(name: QueryParam, value: string | number) {
    try {
        const params = qs.parse(window.location.search, {ignoreQueryPrefix: true}) || {};
        params[name] = value;
        const updatedQs = qs.stringify(params);
        const newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + (updatedQs ? `?${updatedQs}` : "");
        window.history.replaceState({path: newurl}, '', newurl);
    } catch (error) {
        console.error(`Failed to update query param value: ${name}=${value}`, error);
    }
}


export function pushQueryParam(name: QueryParam, value: string | number) {
    try {
        const params = qs.parse(window.location.search, {ignoreQueryPrefix: true}) || {};
        params[name] = value;
        const updatedQs = qs.stringify(params);
        const newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + (updatedQs ? `?${updatedQs}` : "");
        window.history.pushState({path: newurl}, '', newurl);
    } catch (error) {
        console.error(`Failed to update query param value: ${name}=${value}`, error);
    }
}

export function triggerWindowResize() {
    const resizeEvent = window.document.createEvent('UIEvents');
    resizeEvent.initUIEvent('resize', true, false, window, 0);
    window.dispatchEvent(resizeEvent);
}

declare interface NavigationOptions {
    showSignupButton?: boolean,
    showLoginButton?: boolean,
    redirectOnSignOut?: boolean,
    signOutRedirectUrl?: string,
    signUpRedirectUrl?: string,
    largeLogoOnDesktop?: boolean,
    stickyNav?: boolean,
}

export function setupNavigation(options: NavigationOptions) {
    const $headers = document.getElementsByTagName("header");
    const $header = $headers ? $headers.item(0) : undefined;
    const $nav = document.getElementById("#top-nav");


    if (!$nav && !$header) {
        console.warn("Can not find the Vue root element for the nav bar. Not initializing");
        return;
    }
    console.log("Found a navigation header element, initializing the nav bar");

    window.NavBar = new NavBar({
        el: ($nav || $header) as HTMLElement,
        propsData: {
            showSignup: options.showSignupButton,
            redirectOnSignOut: options.redirectOnSignOut || false,
            signOutRedirectUrl: options.signOutRedirectUrl,
            largeLogoOnDesktop: options.largeLogoOnDesktop || false,
            showLogin: options.showLoginButton || false,
            isSticky: options.stickyNav,
            loginRedirectUrl: options.signUpRedirectUrl,
        },
        components: {NavBar: NavBar}
    });
}
