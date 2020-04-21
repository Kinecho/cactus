import {BaseModel, Collection} from "@shared/FirestoreBaseModels";
import {ListMember} from "@shared/mailchimp/models/MailchimpTypes";
import {InsightWord} from "@shared/models/ReflectionResponse";
import {ElementAccumulation} from "@shared/models/ElementAccumulation";
import {DateObject, DateTime} from "luxon";
import * as DateUtil from "@shared/util/DateUtil";
import {getValidTimezoneName} from "@shared/timezones";
import {
    isOptInTrialing,
    MemberSubscription,
    subscriptionTierDisplayName,
    needsTrialExpiration
} from "@shared/models/MemberSubscription";
import { DEFAULT_SUBSCRIPTION_TIER, SubscriptionTier } from "@shared/models/SubscriptionProductGroup";
import { CoreValuesResults } from "@shared/models/CoreValuesAssessmentResponse";
import { CoreValue } from "@shared/models/CoreValueTypes";

export enum JournalStatus {
    PREMIUM = "PREMIUM",
    NONE = "NONE",
    TESTER = "TESTER"
}

export enum NotificationStatus {
    NOT_SET = "NOT_SET",
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE"
}

export enum NotificationChannel {
    email = "email",
    push = "push"
}

export type NotificationSettings = {
    [key in NotificationChannel]: NotificationStatus;
};

export interface ReflectionStats {
    currentStreakDays: number,
    currentStreakWeeks: number,
    currentStreakMonths: number,
    totalDurationMs: number,
    totalCount: number,
    elementAccumulation: ElementAccumulation
}

export enum Field {
    firstName = "firstName",
    lastName = "lastName",
    email = "email",
    userId = "userId",
    signupAt = "signupAt",
    lastSyncedAt = "lastSyncedAt",
    mailchimpListMemberId = "mailchimpListMember.id",
    mailchimpListMemberUniqueEmailId = "mailchimpListMember.unique_email_id",
    mailchimpListMemberWebId = "mailchimpListMember.web_id",
    journalStatus = "journalStatus",
    fcmTokens = "fcmTokens",
    signupConfirmedAt = "signupConfirmedAt",
    lastJournalEntryAt = "lastJournalEntryAt",
    unsubscribedAt = "unsubscribedAt",
    stats = "stats",
    stats_reflections = "reflections",
    activityStatus = "activityStatus",
    promptSendTime = "promptSendTime",
    timeZone = "timeZone",
    promptSendTimeUTC = "promptSendTimeUTC",
    promptSendTimeUTC_hour = "promptSendTimeUTC.hour",
    promptSendTimeUTC_minute = "promptSendTimeUTC.minute",
    subscription = "subscription",
    subscriptionTier = "subscription.tier",
    subscriptionTrialEndsAt = "subscription.trial.endsAt",
    subscriptionStripeId = "subscription.stripeSubscriptionId",
    subscriptionCancellation = "subscription.cancellation",
    subscriptionActivated = "subscription.activated",
    subscriptionCanceledAccessEndsAt = "subscription.cancellation.accessEndsAt",
    stripeCustomerId = "stripe.customerId",
    coreValues = "coreValues",
}

export interface PromptSendTime {
    hour: number,
    minute: 0 | 15 | 30 | 45,
}

export type QuarterHour = 0 | 15 | 30 | 45;

export const DEFAULT_PROMPT_SEND_TIME: PromptSendTime = {hour: 2, minute: 45};

export interface MemberStripeDetails {
    customerId?: string,
}

export default class CactusMember extends BaseModel {
    readonly collection = Collection.members;
    static Field = Field;
    firstName?: string;
    lastName?: string;
    email?: string;
    signupAt?: Date;
    signupConfirmedAt?: Date;
    userId?: string;

    mailchimpListMember?: ListMember;
    lastSyncedAt?: Date;
    lastReplyAt?: Date;
    lastJournalEntryAt?: Date;

    unsubscribeReason?: string;
    unsubscribedAt?: Date;
    unsubscribeCampaignId?: string;

    journalStatus = JournalStatus.NONE;

    fcmTokens?: string[];
    firebaseInstanceIds?: string[];
    notificationSettings: NotificationSettings = {
        [NotificationChannel.email]: NotificationStatus.ACTIVE,
        [NotificationChannel.push]: NotificationStatus.NOT_SET,
    };
    timeZone?: string | null;
    locale?: string | null | undefined;
    promptSendTime?: PromptSendTime;
    readonly promptSendTimeUTC?: PromptSendTime = this.getDefaultPromptSendTimeUTC();
    referredByEmail?: string;
    signupQueryParams: {
        utm_source?: string,
        utm_medium?: string,
        [name: string]: string | undefined
    } = {};

    stats: {
        reflections?: ReflectionStats
    } = {};

    activityStatus?: {
        lastSeenOccurredAt?: Date
    } = {};

    subscription?: MemberSubscription;
    stripe?: MemberStripeDetails = {};

    wordCloud?: InsightWord[];
    coreValues?: CoreValue[];

    prepareForFirestore(): any {
        super.prepareForFirestore();
        this.email = this.email ? this.email.toLowerCase().trim() : this.email;
        this.referredByEmail = this.getReferredBy();
        return this;
    }

    getSignupSource(): string | undefined {
        if (this.signupQueryParams && this.signupQueryParams.utm_source) {
            return this.signupQueryParams.utm_source;
        }
        return;
    }

    getSignupMedium(): string | undefined {
        if (this.signupQueryParams && this.signupQueryParams.utm_medium) {
            return this.signupQueryParams.utm_medium;
        }
        return;
    }

    getReferredBy(): string | undefined {
        if (this.referredByEmail) {
            return this.referredByEmail;
        }
        if (this.mailchimpListMember && this.mailchimpListMember.merge_fields.REF_EMAIL) {
            return this.mailchimpListMember.merge_fields.REF_EMAIL as string | undefined;
        }
        return;
    }

    getFullName(): string {
        return `${this.firstName || ""} ${this.lastName || ""}`.trim();
    }

    getCurrentLocaleDateObject(date: Date = new Date()): DateObject {
        if (this.timeZone) {
            return DateUtil.getDateObjectForTimezone(date, this.timeZone);
        }
        return DateTime.local().toObject();
    }

    getDefaultPromptSendTimeUTC(): PromptSendTime {
        return {
            hour: DateTime.utc().minus({hours: 1}).hour,
            minute: DateUtil.getCurrentQuarterHour()
        } as PromptSendTime;
    }

    /**
     * Use a "valid" timezone to create their local send prompt time preference
     * @return {PromptSendTime | undefined}
     */
    getLocalPromptSendTimeFromUTC(): PromptSendTime | undefined {
        const tz = getValidTimezoneName(this.timeZone);
        if (this.promptSendTimeUTC && tz) {

            const utcDateTime = DateTime.utc().set(this.promptSendTimeUTC);
            const localDateTime = utcDateTime.setZone(tz);

            return {
                hour: localDateTime.hour,
                minute: localDateTime.minute
            } as PromptSendTime;
        }
        return;
    }

    get tier(): SubscriptionTier {
        return this.subscription?.tier ?? DEFAULT_SUBSCRIPTION_TIER
    }

    get tierDisplayName(): string | undefined {
        return subscriptionTierDisplayName(this.tier, this.isOptInTrialing)
    }

    get daysLeftInTrial(): number {
        const end = this.subscription?.trial?.endsAt;
        if (!end) {
            return 0;
        }
        return Math.max(DateUtil.daysUntilDate(end), 0);
    }

    get isOptInTrialing(): boolean {
        return isOptInTrialing(this.subscription)
    }

    get needsTrialExpiration(): boolean {
        return needsTrialExpiration(this.subscription)
    }

    get hasActiveSubscription(): boolean {
        return !!this.subscription && !this.isOptInTrialing && this.tier !== SubscriptionTier.BASIC
    }

    get hasUpcomingCancellation(): boolean {
        return !!this.subscription?.cancellation?.accessEndsAt && 
            this.subscription.cancellation.accessEndsAt > new Date();
    }

    set stripeCustomerId(customerId: string | undefined) {
        const stripeDetails: MemberStripeDetails = this.stripe || {};
        stripeDetails.customerId = customerId;
        this.stripe = stripeDetails;
    }

    get stripeCustomerId(): string | undefined {
        return this.stripe?.customerId;
    }
}