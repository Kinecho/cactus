import { BaseModel, Collection } from "@shared/FirestoreBaseModels";
import { ListMember } from "@shared/mailchimp/models/MailchimpTypes";
import { ElementAccumulation } from "@shared/models/ElementAccumulation";
import { DateObject, DateTime } from "luxon";
import * as DateUtil from "@shared/util/DateUtil";
import { getValidTimezoneName } from "@shared/timezones";
import {
    isOptInTrialing,
    isOptOutTrialing,
    MemberSubscription,
    needsTrialExpiration,
    subscriptionTierDisplayName
} from "@shared/models/MemberSubscription";
import { DEFAULT_SUBSCRIPTION_TIER, SubscriptionTier } from "@shared/models/SubscriptionProductGroup";
import { CoreValue } from "@shared/models/CoreValueTypes";
import { CactusElement } from "@shared/models/CactusElement";
import { InsightWord } from "@shared/api/InsightLanguageTypes";
import { OfferDetails } from "@shared/models/PromotionalOffer";
import { isNull } from "@shared/util/ObjectUtil";
import { MemberExperiments } from "@shared/models/CactusMemberTypes";
import { isBlank } from "@shared/util/StringUtil";

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
    statReflectionCount = 'stats.reflections.totalCount',
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
    subscriptionCancellationAccessEndsAt = "subscription.cancellation.accessEndsAt",
    subscriptionCancellationInitiatedAt = "subscription.cancellation.userInitiatedAt",
    subscriptionActivated = "subscription.activated",
    subscriptionCanceledAccessEndsAt = "subscription.cancellation.accessEndsAt",
    subscriptionOptOutTrialStartedAt = "subscription.optOutTrial.startedAt",
    subscriptionOptOutTrialEndsAt = "subscription.optOutTrial.endsAt",
    stripeCustomerId = "stripe.customerId",
    coreValues = "coreValues",
    focusElement = "focusElement",
    lastReplyAt = "lastReplyAt",
    currentOffer = "currentOffer",
    currentOfferAppliedAt = "currentOffer.appliedAt",
    currentOfferRedeemedAt = "currentOffer.redeemedAt",
}

export interface PromptSendTime {
    hour: number,
    minute: 0 | 15 | 30 | 45,
}

export type QuarterHour = 0 | 15 | 30 | 45;

export const DEFAULT_PROMPT_SEND_TIME: PromptSendTime = { hour: 2, minute: 45 };

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
    adminEmailUnsubscribedAt?: Date;
    timeZone?: string | null;
    locale?: string | null | undefined;
    promptSendTime?: PromptSendTime;
    readonly promptSendTimeUTC?: PromptSendTime = this.getDefaultPromptSendTimeUTC();
    referredByEmail?: string;
    signupQueryParams: {
        utm_source?: string | null,
        utm_medium?: string | null,
        [name: string]: string | undefined | null
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

    focusElement?: CactusElement | null;
    currentOffer?: OfferDetails | null;
    experiments?: MemberExperiments;

    decodeJSON(json: any) {
        super.decodeJSON(json);
        const optOutTrial = this.subscription?.optOutTrial
        if (optOutTrial) {
            optOutTrial.endsAt = this.decodeDate(optOutTrial.endsAt)
            optOutTrial.startedAt = this.decodeDate(optOutTrial.startedAt);
        }

        const trial = this.subscription?.trial;
        if (trial) {
            trial.activatedAt = this.decodeDate(trial.activatedAt);
            trial.endsAt = this.decodeDate(trial.endsAt)!;
        }

        const cancellation = this.subscription?.cancellation;
        if (cancellation) {
            cancellation.accessEndsAt = this.decodeDate(cancellation.accessEndsAt);
            cancellation.processedAt = this.decodeDate(cancellation.processedAt);
            cancellation.initiatedAt = this.decodeDate(cancellation.initiatedAt);
        }

        if (this.activityStatus) {
            this.activityStatus.lastSeenOccurredAt = this.decodeDate(this.activityStatus.lastSeenOccurredAt)
        }

        this.unsubscribedAt = this.decodeDate(this.unsubscribedAt);
        this.signupAt = this.decodeDate(this.signupAt);
        this.signupConfirmedAt = this.decodeDate(this.signupConfirmedAt);
        this.lastSyncedAt = this.decodeDate(this.lastSyncedAt);
        this.lastReplyAt = this.decodeDate(this.lastReplyAt);
        this.lastJournalEntryAt = this.decodeDate(this.lastJournalEntryAt);
        this.adminEmailUnsubscribedAt = this.decodeDate(this.adminEmailUnsubscribedAt);

        this.currentOffer = OfferDetails.fromJSON(this.currentOffer);
    }

    static fromMemberData(data: any): CactusMember {
        const model = new CactusMember();
        model.decodeJSON(data);
        return model;
    }

    prepareFromFirestore(data: any): any {
        this.decodeJSON(data);
    }

    prepareForFirestore(): any {
        const data = super.prepareForFirestore();
        data.email = this.email ? this.email.toLowerCase().trim() : this.email;
        data.referredByEmail = this.getReferredBy();
        data.currentOffer = Object.assign({}, data.currentOffer);
        return data
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

    getSignupCampaign(): string | undefined | null {
        return this.signupQueryParams?.utm_campaign;
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
        return `${ this.firstName || "" } ${ this.lastName || "" }`.trim();
    }

    getCurrentLocaleDateObject(date: Date = new Date()): DateObject {
        if (this.timeZone) {
            return DateUtil.getDateObjectForTimezone(date, this.timeZone);
        }
        return DateTime.local().toObject();
    }

    getDefaultPromptSendTimeUTC(): PromptSendTime {
        return {
            hour: DateTime.utc().minus({ hours: 1 }).hour,
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

    applyExperiments(experiments: Record<string, string | null> | null | undefined): boolean {
        if (!experiments) {
            return false;
        }
        const memberExperiments: MemberExperiments = this.experiments ?? {}
        let changed = false;
        Object.keys(experiments).forEach(expName => {
            if (isBlank(memberExperiments[expName])) {
                memberExperiments[expName] = experiments[expName];
                this.experiments = memberExperiments;
                changed = true;
            }
        })
        return changed;
    }

    get tier(): SubscriptionTier {
        return this.subscription?.tier ?? DEFAULT_SUBSCRIPTION_TIER
    }

    get hasTrialed(): boolean {
        return !isNull(this.subscription?.optOutTrial?.startedAt);
    }

    get tierDisplayName(): string | undefined {
        return subscriptionTierDisplayName(this.tier, this.isOptInTrialing)
    }

    get daysLeftInTrial(): number {
        const end = this.subscription?.optOutTrial?.endsAt || this.subscription?.trial?.endsAt;
        if (!end) {
            return 0;
        }
        return Math.max(DateUtil.daysUntilDate(end), 0);
    }

    get isOptInTrialing(): boolean {
        return isOptInTrialing(this.subscription)
    }

    get isOptOutTrialing(): boolean {
        return isOptOutTrialing(this.subscription)
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

    /**
     * Get a core value with a preferred index, or the last value, which ever is smaller.
     * @param {number} index - the preferred core value index
     * @return {CoreValue | undefined}
     */
    getCoreValueAtIndex(index: number = 0): CoreValue | undefined {
        const coreValues = this.coreValues;
        if (!coreValues || coreValues.length === 0) {
            return undefined;
        }

        const i = index % coreValues.length;
        return coreValues[i];
    }
}