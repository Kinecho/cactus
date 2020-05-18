import "firebase/functions"
import SignupRequest from "@shared/mailchimp/models/SignupRequest";
import {Endpoint, getAuthHeaders, request} from "@web/requestUtils";
import SubscriptionResult from "@shared/mailchimp/models/SubscriptionResult";
import {gtag, fireSignupLeadEvent} from "@web/analytics";
import {addModal, getQueryParam, showModal} from "@web/util";
import {QueryParam} from "@shared/util/queryParams";
import {sendEmailLinkSignIn} from "@web/auth";
import {isValidEmail, isGmail} from "@shared/util/StringUtil";
import {NotificationStatus} from "@shared/models/CactusMember";
import {
    UnsubscribeRequest,
    UnsubscribeResponse,
    UpdateStatusRequest,
    UpdateStatusResponse
} from "@shared/mailchimp/models/UpdateStatusTypes";
import {ListMemberStatus} from "@shared/mailchimp/models/MailchimpTypes";
import {LocalStorageKey} from "@web/services/StorageService";
import CopyService from '@shared/copy/CopyService'
import Logger from "@shared/Logger";

const copy = CopyService.getSharedInstance().copy;
const logger = new Logger("mailchimp.ts");

/**
 *
 * @param {SignupRequest} subscription
 * @return {Promise<SubscriptionResult>}
 */
export async function submitEmail(subscription: SignupRequest): Promise<SubscriptionResult> {
    // subscription.as
    logger.log("submitting subscription", subscription);

    const result = (await request.post(Endpoint.mailchimp, subscription)).data as SubscriptionResult;
    if (result.success) {
        logger.log("Signup successful", result)
    } else {
        logger.warn("not successful getting data from endpoint", result)
    }
    return result
}

export function configureLoginForm(formId: string) {
    const form = document.getElementById(formId);

    if (!form) {
        logger.error("no form found in document for id", formId);
        gtag("event", "exception", {
            description: "no form found on page for formId" + formId,
            fatal: false
        });
        return
    }

    async function processForm(e: Event) {
        if (e.preventDefault) e.preventDefault();
        if (!form) {
            return;
        }

        /* do what you want with the form */
        logger.log("form submitted", formId);

        gtag('event', 'email_signup_clicked', {
            event_category: "email_signup",
            event_label: `${formId}`
        });

        const emailInput = <HTMLInputElement>form.children.namedItem("email");
        const button = <HTMLButtonElement>form.children.namedItem("submit");
        const errors = <HTMLCollection>form.getElementsByClassName("error");
        let errorDiv: HTMLDivElement | null = null;
        if (errors && errors.length > 0) {
            errorDiv = <HTMLDivElement>errors.item(0)
        }

        function showError(message: string) {
            if (errorDiv) {
                errorDiv.innerText = message;
                errorDiv.classList.remove("hidden")
            }
        }

        function hideError() {
            if (errorDiv) {
                errorDiv.classList.add("hidden")
            }
        }

        if (!emailInput) {
            //handle error
            logger.warn("no email input was found");
            gtag("event", "exception", {
                description: "email input field was found for form " + formId,
                fatal: false
            });

            showError("Oops, we are unable to process your request. Please try again later");
            return false;
        }

        let emailAddress = emailInput.value || "";
        emailAddress = emailAddress.trim().toLowerCase();
        logger.log("submitting email", emailAddress);


        if (!isValidEmail(emailAddress)) {
            if (emailAddress.trim().length === 0) {
                showError("Please enter an email address.")
            } else {
                showError(`"${emailAddress}" is not a valid email.`);
            }
            return false
        }

        button.disabled = true;

        try {

            const subscription = new SignupRequest(emailAddress);
            subscription.subscriptionLocation = {page: window.location.pathname, formId};

            let referredByEmail = getQueryParam(QueryParam.SENT_TO_EMAIL_ADDRESS);
            if (!referredByEmail) {
                try {
                    referredByEmail = window.localStorage.getItem(LocalStorageKey.referredByEmail);
                } catch (e) {
                    logger.error("error trying to get referredByEmail from local storage", e)
                }
            }

            if (referredByEmail) {
                subscription.referredByEmail = referredByEmail;
            }

            const signupResult = await sendEmailLinkSignIn(subscription);

            if (signupResult.success) {
                const modalId = "signup-success-modal";
                hideError();

                let title = "Welcome!";
                const message = `To confirm your email address and securely sign in, tap the button in the email sent to ${emailAddress}.`;
                const imageUrl = '/assets/images/benefit4.png';

                if (signupResult.existingEmail) {
                    title = "Welcome back!";
                    // message = `Check your ${emailAddress} inbox to get your Magic Link to finish signing in.`;
                }

                addModal(modalId, {
                    title,
                    message,
                    imageUrl,
                    imageAlt: 'Email Signup Success!',
                    buttonCta: isGmail(emailAddress) ? copy.common.VERIFY_IN_GMAIL : undefined,
                    buttonUrl: isGmail(emailAddress) ? copy.common.VERIFY_GMAIL_URL : undefined
                });
                gtag('event', 'email_signup_success', {
                    event_category: "email_signup",
                    event_label: `${formId}`
                });
                await fireSignupLeadEvent();
                showModal(modalId);


                emailInput.value = "";
            } else if (signupResult.error) {
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
        } catch (error) {
            logger.error("failed to process form", error);
            showError("Sorry, it looks like we're having issues.");
        } finally {
            button.disabled = false
        }

        // You must return false to prevent the default form behavior
        return false;
    }

    form.addEventListener("submit", processForm);

}

export function configureMailchimpSignupForm(formId: string) {
    const form = document.getElementById(formId);

    if (!form) {
        logger.error("no form found in document for id", formId);
        gtag("event", "exception", {
            description: "no form found on page for formId" + formId,
            fatal: false
        });
        return
    }

    async function processForm(e: Event) {
        if (e.preventDefault) e.preventDefault();
        if (!form) {
            return;
        }


        /* do what you want with the form */
        logger.log("form submitted", formId);

        gtag('event', 'email_signup_clicked', {
            event_category: "email_signup",
            event_label: `${formId}`
        });

        const emailInput = <HTMLInputElement>form.children.namedItem("email");
        const button = <HTMLButtonElement>form.children.namedItem("submit");
        const errors = <HTMLCollection>form.getElementsByClassName("error");
        let errorDiv: HTMLDivElement | null = null;
        if (errors && errors.length > 0) {
            errorDiv = <HTMLDivElement>errors.item(0)
        }

        function showError(message: string) {
            if (errorDiv) {
                errorDiv.innerText = message;
                errorDiv.classList.remove("hidden")
            }
        }

        function hideError() {
            if (errorDiv) {
                errorDiv.classList.add("hidden")
            }
        }

        if (!emailInput) {
            //handle error
            logger.warn("no email input was found");
            gtag("event", "exception", {
                description: "email input field was found for form " + formId,
                fatal: false
            });

            showError("Oops, we are unable to process your request. Please try again later");
            return false;
        }

        let emailAddress = emailInput.value || "";
        emailAddress = emailAddress.trim().toLowerCase();
        logger.log("submitting email", emailAddress);


        if (!isValidEmail(emailAddress)) {
            if (emailAddress.trim().length === 0) {
                showError("Please enter an email address.")
            } else {
                showError(`"${emailAddress}" is not a valid email.`);
            }
            return false
        }

        button.disabled = true;

        try {

            const subscription = new SignupRequest(emailAddress);
            subscription.subscriptionLocation = {page: window.location.pathname, formId};

            const referredParam = getQueryParam(QueryParam.SENT_TO_EMAIL_ADDRESS);
            if (referredParam) {
                subscription.referredByEmail = referredParam;
            }

            const signupResult = await submitEmail(subscription);

            if (signupResult.success) {
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
            } else if (signupResult.error) {
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
        } catch (error) {
            logger.error("failed to process form", error);
            showError("Sorry, it looks like we're having issues.");
        } finally {
            button.disabled = false
        }

        // You must return false to prevent the default form behavior
        return false;
    }

    form.addEventListener("submit", processForm);
}


export function setupJumpToForm(buttonClass: string = "jump-to-form") {
    const buttons = <HTMLCollectionOf<HTMLButtonElement>>document.getElementsByClassName(buttonClass);

    Array.from(buttons).forEach(button => {
        if (!button) {
            return
        }

        const scrollToId = button.dataset.scrollTo;
        const doFocus = Boolean(button.dataset.focusForm);
        const focusFormId = button.dataset.focusForm;
        logger.log("scrolling to", scrollToId);

        if (!scrollToId) {
            logger.log("no content to scroll to");
            return;
        }

        const content = document.getElementById(scrollToId);

        button.addEventListener("click", () => {
            gtag("event", "scroll_to", {formId: scrollToId});
            if (content) content.scrollIntoView();
            if (doFocus && focusFormId) {
                const form = document.getElementById(focusFormId);
                if (form) {
                    const input = form.getElementsByTagName("input").item(0);
                    if (input) {
                        input.focus()
                    }
                }
            }
        })
    })
}

export async function confirmUnsubscribe(options: UnsubscribeRequest): Promise<UnsubscribeResponse> {
    return (await request.post(Endpoint.unsubscribeConfirm, options)).data as UnsubscribeResponse;
}

export async function updateSubscriptionStatus(status: NotificationStatus, email: string): Promise<UpdateStatusResponse> {

    const updateRequest: UpdateStatusRequest = {status: ListMemberStatus.subscribed, email: email};
    switch (status) {
        case NotificationStatus.NOT_SET:
            //nothing to do here
            return {success: true};
        case NotificationStatus.ACTIVE:
            updateRequest.status = ListMemberStatus.subscribed;
            break;
        case NotificationStatus.INACTIVE:
            updateRequest.status = ListMemberStatus.unsubscribed;
            break;
    }

    const headers = await getAuthHeaders();
    try {
        const response = await request.put(Endpoint.updateSubscriberStatus, updateRequest, {headers: {...headers}});

        return response.data;
    } catch (error) {
        logger.error("Unable to update the user's status");
        //TODO: Show snackbar error;
        return {error: error, success: false};
    }

}