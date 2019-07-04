import "firebase/functions"
import SubscriptionRequest from "@shared/mailchimp/models/SubscriptionRequest";
import {Endpoint, request} from "@web/requestUtils";
import SubscriptionResult from "@shared/mailchimp/models/SubscriptionResult";
import {gtag} from "@web/analytics";
import {addModal, getQueryParam, showModal} from "@web/util";
import {QueryParam} from "@shared/util/queryParams";
import {sendEmailLinkSignIn} from "@web/auth";
import {isValidEmail} from "@shared/util/StringUtil";

/**
 *
 * @param {SubscriptionRequest} subscription
 * @return {Promise<SubscriptionResult>}
 */
export async function submitEmail(subscription:SubscriptionRequest): Promise<SubscriptionResult>{
    // subscription.as
    console.log("submitting subscription", subscription);

    const result = (await request.post(Endpoint.mailchimp, subscription)).data as SubscriptionResult;
    if (result.success){
        console.log("Signup successful", result)
    } else {
        console.warn("not successful getting data from endpoint", result)
    }
    return result
}

export function configureLoginForm(formId:string){
    const form = document.getElementById(formId);

    if (!form){
        console.error("no form found in document for id", formId);
        gtag("event", "exception", {
            description: "no form found on page for formId" + formId,
            fatal: false
        });
        return
    }


    async function processForm(e) {
        if (e.preventDefault) e.preventDefault();
        /* do what you want with the form */
        console.log("form submitted", formId);

        gtag('event', 'email_signup_clicked', {
            event_category: "email_signup",
            event_label: `${formId}`
        });

        const emailInput = <HTMLInputElement>form.children.namedItem("email");
        const button = <HTMLButtonElement>form.children.namedItem("submit");
        const errors = <HTMLCollection>form.getElementsByClassName("error");
        let errorDiv:HTMLDivElement = null;
        if (errors && errors.length > 0){
            errorDiv = <HTMLDivElement>errors.item(0)
        }

        function showError(message: string){
            if (errorDiv){
                errorDiv.innerText = message;
                errorDiv.classList.remove("hidden")
            }
        }

        function hideError(){
            if (errorDiv){
                errorDiv.classList.add("hidden")
            }
        }

        if (!emailInput) {
            //handle error
            console.warn("no email input was found");
            gtag("event", "exception", {
                description: "email input field was found for form " + formId,
                fatal: false
            });

            showError("Oops, we are unable to process your request. Please try again later");
            return false;
        }

        let emailAddress = emailInput.value || "";
        emailAddress = emailAddress.trim().toLowerCase();
        console.log("submitting email", emailAddress);


        if (!isValidEmail(emailAddress)){
            if (emailAddress.trim().length === 0) {
                showError("Please enter an email address.")
            } else {
                showError(`"${emailAddress}" is not a valid email.`);
            }
            return false
        }

        button.disabled = true;

        try {

            const subscription = new SubscriptionRequest(emailAddress);
            subscription.subscriptionLocation = {page: window.location.pathname, formId};

            const referredParam = getQueryParam(QueryParam.SENT_TO_EMAIL_ADDRESS);
            if (referredParam){
                subscription.referredByEmail = referredParam;
            }

            const signupResult = await sendEmailLinkSignIn(subscription);

            if (signupResult.success){
                const modalId = "signup-success-modal";
                hideError();
                addModal(modalId, {
                    title: "Success!",
                    message: `Look for the confirmation email in your ${emailAddress} inbox.`,
                    imageUrl: '/assets/images/success.svg',
                    imageAlt: 'Success!',
                });
                gtag('event', 'email_signup_success', {
                    event_category: "email_signup",
                    event_label: `${formId}`
                });
                showModal(modalId);


                emailInput.value = "";
            } else if (signupResult.error){
                gtag('event', 'email_signup_error', {
                    event_category: "email_signup",
                    event_label: `${formId}`
                });
                showError(signupResult.error.friendlyMessage || "Sorry, it looks like we're having issues. Please try again later.")
            } else {

                gtag('event', 'email_signup_error', {
                    event_category: "email_signup",
                    event_label: `${formId}`
                });
                showError("Sorry, it looks like we're having issues. Please try again later");
            }
        } catch (error){
            console.error("failed to process form", error);
            showError("Sorry, it looks like we're having issues.");
        } finally {
            button.disabled = false
        }

        // You must return false to prevent the default form behavior
        return false;
    }

    form.addEventListener("submit", processForm);

}

export function configureMailchimpSignupForm(formId:string){
    const form = document.getElementById(formId);

    if (!form){
        console.error("no form found in document for id", formId);
        gtag("event", "exception", {
            description: "no form found on page for formId" + formId,
            fatal: false
        });
        return
    }

    async function processForm(e) {
        if (e.preventDefault) e.preventDefault();
        /* do what you want with the form */
        console.log("form submitted", formId);

        gtag('event', 'email_signup_clicked', {
            event_category: "email_signup",
            event_label: `${formId}`
        });

        const emailInput = <HTMLInputElement>form.children.namedItem("email");
        const button = <HTMLButtonElement>form.children.namedItem("submit");
        const errors = <HTMLCollection>form.getElementsByClassName("error");
        let errorDiv:HTMLDivElement = null;
        if (errors && errors.length > 0){
            errorDiv = <HTMLDivElement>errors.item(0)
        }

        function showError(message: string){
            if (errorDiv){
                errorDiv.innerText = message;
                errorDiv.classList.remove("hidden")
            }
        }

        function hideError(){
            if (errorDiv){
                errorDiv.classList.add("hidden")
            }
        }

        if (!emailInput) {
            //handle error
            console.warn("no email input was found");
            gtag("event", "exception", {
                description: "email input field was found for form " + formId,
                fatal: false
            });

            showError("Oops, we are unable to process your request. Please try again later");
            return false;
        }

        let emailAddress = emailInput.value || "";
        emailAddress = emailAddress.trim().toLowerCase();
        console.log("submitting email", emailAddress);


        if (!isValidEmail(emailAddress)){
            if (emailAddress.trim().length === 0) {
                showError("Please enter an email address.")
            } else {
                showError(`"${emailAddress}" is not a valid email.`);
            }
            return false
        }

        button.disabled = true;

        try {

            const subscription = new SubscriptionRequest(emailAddress);
            subscription.subscriptionLocation = {page: window.location.pathname, formId};

            const referredParam = getQueryParam(QueryParam.SENT_TO_EMAIL_ADDRESS);
            if (referredParam){
                subscription.referredByEmail = referredParam;
            }

            const signupResult = await submitEmail(subscription);

            if (signupResult.success){
                const modalId = "signup-success-modal";
                hideError();
                addModal(modalId, {
                    title: "Success!",
                    message: `Look for the confirmation email in your ${emailAddress} inbox.`,
                    imageUrl: '/assets/images/success.svg',
                    imageAlt: 'Success!',
                });
                gtag('event', 'email_signup_success', {
                    event_category: "email_signup",
                    event_label: `${formId}`,

                });
                showModal(modalId);


                emailInput.value = "";
            } else if (signupResult.error){
                gtag('event', 'email_signup_error', {
                    event_category: "email_signup",
                    event_label: `${formId}`
                });
                showError(signupResult.error.friendlyMessage || "Sorry, it looks like we're having issues. Please try again later.")
            } else {

                gtag('event', 'email_signup_error', {
                    event_category: "email_signup",
                    event_label: `${formId}`
                });
                showError("Sorry, it looks like we're having issues. Please try again later");
            }
        } catch (error){
            console.error("failed to process form", error);
            showError("Sorry, it looks like we're having issues.");
        } finally {
            button.disabled = false
        }

        // You must return false to prevent the default form behavior
        return false;
    }

    form.addEventListener("submit", processForm);
}



export function setupJumpToForm(buttonClass:string="jump-to-form"){
    const buttons = <HTMLCollectionOf<HTMLButtonElement>> document.getElementsByClassName(buttonClass);

    Array.from(buttons).forEach(button => {
        if (!button){
            return
        }

        const scrollToId = button.dataset.scrollTo;
        const doFocus = Boolean(button.dataset.focusForm);

        console.log("scrolling to", scrollToId);
        const content = document.getElementById(scrollToId);

        button.addEventListener("click", () => {
            gtag("event", "scroll_to", {formId: scrollToId});
            content.scrollIntoView();
            if (doFocus){
                const form = document.getElementById(button.dataset.focusForm);
                if (form){
                    const input = form.getElementsByTagName("input").item(0);
                    if (input) {
                        input.focus()
                    }
                }
            }
        })
    })
}