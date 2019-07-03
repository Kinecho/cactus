import MailchimpListMember from "@shared/mailchimp/models/MailchimpListMember";
import ApiError from "@shared/ApiError";

export enum SubscriptionResultStatus {
    new_subscriber = "new_subscriber",
    existing_subscriber = "existing_subscriber",
    unknown = "unknown",
}

export default class SubscriptionResult {
    success: boolean = false;
    member?: MailchimpListMember;
    error?: ApiError;
    status: SubscriptionResultStatus = SubscriptionResultStatus.unknown
}