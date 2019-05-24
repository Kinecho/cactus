import ListMember from "@api/mailchimp/models/ListMember";
import ApiError from "@shared/ApiError";

export enum SubscriptionResultStatus {
    new_subscriber = "new_subscriber",
    existing_subscriber = "existing_subscriber",
    unknown = "unknown",
}

export default class SubscriptionResult {
    success: boolean = false;
    member?: ListMember;
    error?: ApiError;
    status: SubscriptionResultStatus = SubscriptionResultStatus.unknown
}