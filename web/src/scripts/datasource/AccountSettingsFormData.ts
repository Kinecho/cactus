import CactusMember, {
    DEFAULT_PROMPT_SEND_TIME,
    NotificationChannel,
    NotificationSettings,
    NotificationStatus,
    PromptSendTime
} from "@shared/models/CactusMember";
import {FirebaseUser} from "@web/firebase"
import CactusMemberService from "@web/services/CactusMemberService";
import {isBlank, isValidEmail} from "@shared/util/StringUtil";

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
    [fieldName: string]: FieldValidation
}

export interface SaveFormResult {
    errors?: string[];
    member?: CactusMember | undefined;
    success: boolean;
    validation?: FormValidation;
}

class FormValidation {
    validations: Validations = {};

    add(field: string, message: string, level: ValidationLevel) {
        this.validations[field] = {message, level}
    }

    remove(field: string) {
        delete this.validations[field];
    }

    get hasWarnings(): boolean {
        return !!Object.values(this.validations).find(v => v.level === "warning");
    }

    get hasErrors(): boolean {
        return !!Object.values(this.validations).find(v => v.level === "error");
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

    validate(): FormValidation {
        const validations = new FormValidation();

        if (!isValidEmail(this.email)) {
            validations.add("email", "Please enter a valid email", "error");
        }

        if (isBlank(this.lastName)) {
            validations.add("lastName", "Please enter a Last Name", "warning")
        }

        if (isBlank(this.firstName)) {
            validations.add("firstName", "Please enter a First Name", "warning")
        }

        return validations
    }
}

export default class AccountSettingsFormData {
    member?: CactusMember;
    user?: FirebaseUser;
    original = new FormData();
    current = new FormData();
    private initialized = false;
    validations = new FormValidation();

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
        this.validations = new FormValidation();
    }

    async save(): Promise<SaveFormResult> {
        const member = this.member;
        if (!member) {
            console.error("No cactus member was found when trying to save AccountSettings FormData");
            return {errors: ["No member found. Unable to save the form."], success: false};
        }
        try {
            const validation = this.current.validate();
            this.validations = validation;
            if (validation.hasErrors) {
                return {validation: validation, success: false}
            }

            const {firstName, lastName, timeZone, notificationSettings, promptSendTime} = this.current;

            member.firstName = firstName;
            member.lastName = lastName;
            member.timeZone = timeZone;
            member.notificationSettings = notificationSettings;
            member.promptSendTime = promptSendTime;
            const saved = await CactusMemberService.sharedInstance.save(member);

            return {
                success: true,
                member: saved,
            }
        } catch (error) {
            console.error("Failed to save cactus member form data", error);
            return {
                success: false,
                errors: [error.message || "Unable to save the account settings."]
            }
        }
    }

    get hasChanges(): boolean {
        return this.initialized && !this.original.equals(this.current)
    }
}