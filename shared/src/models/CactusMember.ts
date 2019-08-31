import {BaseModel, Collection} from "@shared/FirestoreBaseModels";
import {ListMember} from "@shared/mailchimp/models/MailchimpTypes";

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

    fcmTokens?: [string];
    notificationSettings: NotificationSettings = {
        [NotificationChannel.email]: NotificationStatus.ACTIVE,
        [NotificationChannel.push]: NotificationStatus.NOT_SET,
    };
    timeZone?: string | null;
    referredByEmail?: string;
    signupQueryParams: {
        utm_source?: string,
        utm_medium?: string,
        [name: string]: string | undefined
    } = {};

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
}