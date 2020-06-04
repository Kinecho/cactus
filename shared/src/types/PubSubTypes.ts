export enum PubSubTopic {
    firestore_backup = "firestore_backup",
    firestore_export_bigquery = "firestore_export_bigquery",
    process_mailchimp_email_recipients = "process_mailchimp_email_recipients",
    bridge_to_monday_prune = "bridge_to_monday_prune",
    unsubscriber_sync = "unsubscriber_sync",
    slack_command = "slack_command",
    create_daily_sent_prompts = "create_daily_sent_prompts",
    member_stats_sync = "member_stats_sync",
    custom_sent_prompt_notifications = "custom_sent_prompt_notifications",
    expire_subscription_trials = "expire_subscription_trials",
    sync_trial_members_to_mailchimp = "sync_trial_members_to_mailchimp",
    android_google_play_billing_events = "android_google_play_billing_events",
    process_cancellations = "process_cancellations",
    revenuecat_events = "revenuecat_events",

}


export interface CampaignRecipientJobPayload {
    campaignId: string,
    reflectionPromptId?: string
}
