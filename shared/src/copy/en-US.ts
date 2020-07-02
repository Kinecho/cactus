import {
    AuthenticationCopy,
    CommonCopy,
    ErrorCopy,
    LocaleSettings,
    LocalizedCopy,
    NavigationCopy,
    PromptCopy,
    ElementCopy,
    PronounCopy,
    AccountCopy, CheckoutCopy,
} from "@shared/copy/CopyTypes";
import { BillingPeriod } from "@shared/models/SubscriptionProduct";

export default class EnglishCopy extends LocalizedCopy {
    settings: LocaleSettings = {
        dates: {
            longFormat: "LLLL d, yyyy",
            shortFormat: "L/d/yyyy",
        }
    };
    pronouns: PronounCopy = {
        YOU: "you"
    };

    checkout: CheckoutCopy = {
        UPGRADE: "Upgrade",
        TRY_CACTUS_PLUS: "Try Cactus Plus",
        CURRENT_PLAN: "Current Plan",
        MANAGE_MY_PLAN: "Manage My Plan",
        PURCHASE: "Purchase",
        SIGN_IN_TO_CONTINUE_CHECKOUT: "Please log in to continue the upgrade process.",
        SIGN_IN_TO_CONTINUE_RESTORING_PURCHASES: "Please sign in to restoring your purchases",
        BILLING_PERIOD: {
            [BillingPeriod.weekly]: "Weekly",
            [BillingPeriod.monthly]: "Monthly",
            [BillingPeriod.yearly]: "Annual",
            [BillingPeriod.once]: "One Time",
            [BillingPeriod.never]: "Free",
        },
        BILLING_PERIOD_PER: {
            [BillingPeriod.weekly]: "Week",
            [BillingPeriod.monthly]: "Month",
            [BillingPeriod.yearly]: "Year",
            [BillingPeriod.once]: "Once",
            [BillingPeriod.never]: "Never",
        },
        TIER_BASIC: "Basic",
        TIER_PLUS: "Plus",
        TIER_PREMIUM: "Premium",
    };

    account: AccountCopy = {
        PREFERRED_NOTIFICATION_TIME: "What time would you like to be notified?",
        SELECTED_TIMEZONE_DIFFERS_FROM_DEVICE: "Your device's time zone doesn't match your selected time zone.",
        UPDATE_TIMEZONE_TO: "Would you like to update your time zone to",
        CANCEL_UPDATE_TIMEZONE: "No, don't update",
        CONFIRM_UPDATE_TIMEZONE: "Yes, update timezone",
        EMAIL_NOTIFICATION_CHECKBOX_LABEL: "Receive an email when a new prompt is ready",
        PERMANENTLY_DELETE_ACCOUNT: "Permanently Delete Account...",
        DELETE_ACCOUNT: "Delete Cactus Account"
    };

    common: CommonCopy = {
        LOG_IN: "Log In",
        NEXT: "Next",
        SIGN_UP: "Sign Up",
        TRY_IT_FREE: "Try It Free",
        SUBMIT: "Submit",
        SIGNING_IN: "Signing In",
        PRICING: "Pricing",
        LOG_OUT: "Log Out",
        ENTER_YOUR_EMAIL_ADDRESS: "Enter your email address",
        WELCOME: "Welcome",
        WELCOME_BACK: "Welcome back",
        ACCOUNT: "Account",
        EMAIL: "Email",
        EMAIL_ADDRESS: "Email Address",
        SUBSCRIPTION: "Subscription",
        TIER: "Tier",
        FIRST_NAME: "First Name",
        LAST_NAME: "Last Name",
        NOTIFICATIONS: "Notifications",
        REMOVE: "Remove",
        TIME_ZONE: "Time Zone",
        LOADING: "Loading",
        HOUR: "Hour",
        MINUTE: "Minute",
        DAYS_LEFT: "days left",
        DAY_LEFT: "day left",
        DAYS_LEFT_IN_TRIAL: "days left in trial",
        DAY_LEFT_IN_TRIAL: "day left in trial",
        TRIAL_ENDS_TODAY: "Trial ends today",
        ENDS_TODAY: "Ends today",
        LEARN_MORE: "Learn More",
        TRIAL: "Trial",
        IOS: "iOS",
        ANDROID: "Android",
        VERIFY_IN_GMAIL: "Confirm in Gmail",
        VERIFY_GMAIL_URL: "https://mail.google.com/mail/u/0/#search/from%3A%40cactus.app+in%3Aanywhere"
    };
    navigation: NavigationCopy = {
        ACCOUNT: "Account",
        CORE_VALUES: "Core Values",
        SOCIAL: "Friends",
        MY_JOURNAL: "My Journal",
        JOURNAL: "Journal",
        ACTIVITY: "Activity",
        INSIGHTS: "Insights",
        COMPOSE: "Compose",
        HOME: "Home"
    };
    prompts: PromptCopy = {
        TODAY: "Today",
        EDIT_NOTE: "Edit Note",
        REFLECT: "Reflect",
        SHARE_PROMPT: "Share Prompt",
        ADD_A_NOTE: "Add a Note",
        DONE: "Done",
        CLOSE: "Close",
        TAP_ANYWHERE: "Tap Anywhere",
        SAVED: "Saved",
        SAVING: "Saving",
        CELEBRATIONS: ["Well done!", "Nice work!", "Way to go!"],
        REFLECTIONS: "Reflections",
        SECONDS: "Seconds",
        SECOND: "Second",
        MINUTES: "Minutes",
        DAY_STREAK: "Day Streak",
        WEEK_STREAK: "Week Streak",
        MONTH_STREAK: "Month Streak",
        GO_HOME: "Go Home",
        SIGN_UP_MESSAGE: "Sign Up to Keep it Going",
        SHARE_YOUR_NOTE: "Share Your Note",
        SHARE_NOTE: "Share Note",
        SHARE_PROMPT_COPY_MD: "Become more courageous and **build trust and connection** with others.",
    };
    elements: ElementCopy = {
        MEANING: "Meaning",
        MEANING_DESCRIPTION: "Living with a sense of purpose while you enjoy the present",
        EXPERIENCE: "Experience",
        EXPERIENCE_DESCRIPTION: "Exploring your intellectual curiosities and openly observing life’s lessons",
        ENERGY: "Energy",
        ENERGY_DESCRIPTION: "Caring for your physical health and managing the mind-body connection",
        EMOTIONS: "Emotions",
        EMOTIONS_DESCRIPTION: "Embracing the spectrum of emotions as you strive for optimism",
        RELATIONSHIPS: "Relationships",
        RELATIONSHIPS_DESCRIPTION: "Developing rewarding and fulfilling relationships with yourself and others",
    };
    error: ErrorCopy = {
        PLEASE_ENTER_A_VALID_EMAIL_ADDRESS: "Please enter a valid email address",
        PLEASE_ENTER_AN_EMAIL_ADDRESS: "Please enter an email address",
        SORRY_WE_ARE_HAVING_ISSUES: "Sorry, it looks like we're having issues.",
        SORRY_WE_ARE_HAVING_ISSUES_TRY_AGAIN: "Sorry, it looks like we're having issues. Please try again later.",
    };

    auth: AuthenticationCopy = {
        CONNECTED_ACCOUNTS: "Connected Accounts",
        DISPLAY_NAME: "Display Name",
        MEMBER_SINCE: "Member Since",
        SIGN_UP_FREE: "Sign Up Free",
        magicLinkSuccess(email: string): string {
            return `To confirm your email address and securely sign in, tap the button in the email sent to ${ email }.`
        }
    };

    exclamation(input?: string): string {
        if (!input) {
            return "";
        }
        return `${ input }!`;
    }


}
