import ListMember from "@api/mailchimp/models/ListMember";

export default class SubscriptionResult {
    success: boolean = false;
    member?: ListMember
}