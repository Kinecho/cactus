import CactusMember, {
    DEFAULT_PROMPT_SEND_TIME,
    NotificationChannel,
    NotificationSettings,
    NotificationStatus,
    PromptSendTime
} from "@shared/models/CactusMember";
import {FirebaseUser, FirebaseUserCredential} from "@web/firebase"
import CactusMemberService from "@web/services/CactusMemberService";
import {isBlank, isValidEmail} from "@shared/util/StringUtil";
import {ChangeEmailResponse, ChangeEmailResponseCode} from "@shared/api/SignupEndpointTypes";
import {createAuthModal} from "@web/auth";
import {closeModal, showModal} from "@web/util";

const DEFAULT_NOTIFICATION_SETTINGS = (): NotificationSettings => ({
    [NotificationChannel.email]: NotificationStatus.NOT_SET,
    [NotificationChannel.push]: NotificationStatus.NOT_SET,
});

export type ValidationLevel = "error" | "warning"

export interface FieldValidation {
    message: string,
    level: ValidationLevel
}

export interface Validations {
    [fieldName: string]: FieldValidation | undefined
}

export interface SaveFormResult {
    errors?: string[];
    member?: CactusMember | undefined;
    success: boolean;
    validator: FormValidator;
}

interface Validator {
    check(input: any): FieldValidation | undefined;
}

abstract class AbstractValidator implements Validator {
    fieldName: string;
    displayName: string;

    protected constructor(fieldName: string, displayName?: string) {
        this.fieldName = fieldName;
        this.displayName = displayName || fieldName;
    }

    get defaultErrorMessage(): string {
        return `${this.displayName} is not valid.`;
    }

    isNumber(x: any): x is number {
        return typeof x === "number";
    }

    isString(x: any): x is string {
        return typeof x === "string";
    }

    abstract check(input: any): FieldValidation | undefined;
}

// class CustomValidator extends Validator {
//     validator: ()
// }

class RequiredValidator extends AbstractValidator {
    level: ValidationLevel = "error";

    constructor(fieldName: string, displayName?: string, level: ValidationLevel = "error") {
        super(fieldName, displayName);
        this.level = level;
    }

    isValid(input: any): boolean {
        if (typeof input === "string") {
            return !isBlank(input);
        } else {
            return input !== undefined && input !== null;
        }
    }

    get defaultErrorMessage(): string {
        return `${this.displayName} is required.`;
    }

    check(input: any): FieldValidation | undefined {
        if (this.isValid(input)) {
            return;
        }
        return {level: this.level, message: this.defaultErrorMessage}

    }
}

export class FormValidator {
    validations: Validations = {};

    validators: { [fieldName: string]: Validator[] } = {};

    add(arg: string | AbstractValidator, inlineValidator?: Validator) {
        let field: string;
        let validator: Validator;
        if (arg instanceof AbstractValidator) {
            field = arg.fieldName;
            validator = arg;
        } else if (inlineValidator) {
            field = arg;
            validator = inlineValidator;
        } else {
            return;
        }

        const fieldValidators = this.validators[field] || [];
        fieldValidators.push(validator);
        this.validators[field] = fieldValidators;
        this.validations[field] = undefined;
    }

    set(field: string, validationResult: FieldValidation) {
        this.validations[field] = validationResult
    }

    remove(field: string) {
        this.validations[field] = undefined;
    }

    run(form: any) {
        this.clear();
        Object.keys(this.validators).forEach(fieldName => {
            const value = form[fieldName];
            this.validateField(fieldName, value);
        })
    }

    clear() {
        this.validations = {};
    }

    validateField(fieldName: string, value: any) {
        const validationIssue = this.validators[fieldName]?.map(validator => validator.check(value)).find(issue => issue !== undefined);
        if (validationIssue) {
            this.set(fieldName, validationIssue)
        } else {
            this.remove(fieldName);
        }
    }

    get hasWarnings(): boolean {
        return !!Object.values(this.validations).find(v => v?.level === "warning");
    }

    get hasErrors(): boolean {
        return !!Object.values(this.validations).find(v => v?.level === "error");
    }

    isError(field: string): boolean {
        return this.validations[field]?.level === "error"
    }

    isWarning(field: string): boolean {
        return this.validations[field]?.level === "warning"
    }

    getLevel(field: string): ValidationLevel | undefined {
        return this.validations[field]?.level;
    }

    getMessage(field: string): string | undefined {
        return this.validations[field]?.message;
    }
}

class FormData {
    firstName: string | undefined = undefined;
    lastName: string | undefined = undefined;
    email: string | undefined = undefined;
    notificationSettings: NotificationSettings = DEFAULT_NOTIFICATION_SETTINGS();
    promptSendTime: PromptSendTime = DEFAULT_PROMPT_SEND_TIME();
    timeZone: string | null | undefined = undefined;
    validator: FormValidator = FormData.createValidator();

    validateField(fieldName: string) {
        const data = this as any;
        this.validator.validateField(fieldName, data[fieldName]);
        console.log(this.validator.validations);
    }

    static create(args: { member?: CactusMember, user?: FirebaseUser }): FormData {
        const {member, user} = args;
        const data = new FormData();
        data.setData({member, user});
        return data;
    }

    setData(args: { member?: CactusMember, user?: FirebaseUser }) {
        const {member, user} = args;
        this.firstName = member?.firstName;
        this.lastName = member?.lastName;
        this.email = member?.email;
        this.notificationSettings = member?.notificationSettings || DEFAULT_NOTIFICATION_SETTINGS();
        this.promptSendTime = member?.promptSendTime || DEFAULT_PROMPT_SEND_TIME();
        this.timeZone = member?.timeZone;
    }

    clone(): FormData {
        return Object.assign(new FormData(), this);
    }

    equals(other: FormData): boolean {
        return this.firstName?.trim() === other.firstName?.trim() &&
            this.lastName?.trim() === other.lastName?.trim() &&
            this.email?.trim() === other.email?.trim() &&
            this.notificationSettings?.email === other.notificationSettings?.email &&
            this.notificationSettings?.push === other.notificationSettings?.push &&
            this.promptSendTime?.hour === other.promptSendTime?.hour &&
            this.promptSendTime?.minute === other.promptSendTime?.minute &&
            this.timeZone === other.timeZone
    }

    static createValidator(): FormValidator {
        const formValidator = new FormValidator();

        formValidator.add(new RequiredValidator("email", "Email"));
        formValidator.add("email", {
            check: (value: any) => {
                return isValidEmail(value) ? undefined : {message: "Please enter a valid email", level: "error"}
            }
        });

        formValidator.add(new RequiredValidator("lastName", "Last Name", "warning"));
        formValidator.add(new RequiredValidator("firstName", "First Name", "warning"));

        return formValidator;

    }

    validate(): FormValidator {
        this.validator.run(this);
        return this.validator
    }
}

export default class AccountSettingsFormData {
    member?: CactusMember;
    user?: FirebaseUser;
    original = new FormData();
    current = new FormData();
    private initialized = false;

    validator = this.current.validator;

    update(args: { member?: CactusMember, user?: FirebaseUser }) {
        const {member, user} = args;
        if (member && !this.member) {
            this.member = member;
        }
        if (user && !this.user) {
            this.user = user;
        }

        if (!this.initialized) {
            this.initialize()
        } else if (member && user) {
            this.original.setData({member, user});
            this.current.setData({member, user});
        }
    }

    initialize() {
        if (this.initialized || !this.user || !this.member) {
            return;
        }
        const {member, user} = this;
        const originalData = FormData.create({member, user});
        this.original = originalData;
        this.current = originalData.clone();

        this.initialized = true;
    }

    resetAll() {
        this.current = this.original.clone();
        this.current.validator.clear();
        this.original.validator.clear();
    }

    async save(): Promise<SaveFormResult> {
        const member = this.member;
        const validator = this.current.validate();
        if (!member) {
            console.error("No cactus member was found when trying to save AccountSettings FormData");
            return {errors: ["No member found. Unable to save the form."], success: false, validator};
        }
        try {
            if (validator.hasErrors) {
                return {validator: validator, success: false}
            }

            const {firstName, lastName, timeZone, notificationSettings, promptSendTime, email} = this.current;
            const oldEmail = this.original.email;

            if (email && oldEmail?.trim().toLowerCase() !== email?.trim().toLowerCase()) {
                const emailResult = await this.changeEmail(email);
                if (emailResult.code === ChangeEmailResponseCode.SUCCESS) {
                    member.email = email;
                }
            }

            member.firstName = firstName;
            member.lastName = lastName;
            member.timeZone = timeZone;
            member.notificationSettings = notificationSettings;
            member.promptSendTime = promptSendTime;
            const saved = await CactusMemberService.sharedInstance.save(member);

            return {
                success: true,
                member: saved,
                validator,
            }
        } catch (error) {
            console.error("Failed to save cactus member form data", error);
            return {
                success: false,
                errors: [error.message || "Unable to save the account settings."],
                validator,
            }
        }
    }

    async changeEmail(email: string, allowRetry = true): Promise<ChangeEmailResponse> {
        console.log("Attempting to change email");
        const user = this.user;
        try {
            await user?.updateEmail(email);
            return {
                emailAvailable: true,
                newEmail: email,
                confirmationEmailSent: true,
                code: ChangeEmailResponseCode.SUCCESS
            };
        } catch (error) {
            console.error("Failed to update user's email", error);
            if (error.code === "auth/requires-recent-login") {
                if (allowRetry) {
                    const {success: reAuthSuccess} = await this.reauthenticateUser();
                    if (reAuthSuccess) {
                        return this.changeEmail(email, false);
                    } else {
                        console.error("Unable to re-log in the user. Can not change email", error);
                        return {
                            emailAvailable: false,
                            code: ChangeEmailResponseCode.CREDENTIAL_TOO_OLD,
                            error,
                            newEmail: email,
                            confirmationEmailSent: false
                        }
                    }
                } else {
                    console.warn("The credential is too old, but we are not retrying any more times to prevent an infinite loop");
                    return {
                        emailAvailable: false,
                        code: ChangeEmailResponseCode.CREDENTIAL_TOO_OLD,
                        error,
                        newEmail: email,
                        confirmationEmailSent: false
                    }
                }
            }
            return {
                emailAvailable: false,
                code: ChangeEmailResponseCode.UNKNKOWN_ERROR,
                error,
                newEmail: email,
                confirmationEmailSent: false
            }
        }

    }

    async reauthenticateUser(): Promise<{ success: boolean, credential?: FirebaseUserCredential }> {
        const [provider] = this.user?.providerData || [];
        if (provider) {
            try {
                console.log("attempting to reauthenticate with provider", provider);
                const {modalId, loginPromise} = createAuthModal({
                    title: "Please Sign in Again",
                    message: "It's been a while since you last signed in, and for security purposes, you must sign in again in order to change your email."
                });
                console.log("awaiting login promise...");
                showModal(modalId);
                const credential = await loginPromise;
                closeModal(modalId);
                // const credential = await this.user?.reauthenticateWithPopup(provider);
                console.log("Successfully reauthenticated with provider");
                return {success: true, credential};
            } catch (error) {
                console.error("Error authenticating the user", error);
            }
        } else {
            console.warn("No providers found, can not reauthenticate")
        }

        return {success: false};
    }

    get hasChanges(): boolean {
        return this.initialized && !this.original.equals(this.current)
    }
}