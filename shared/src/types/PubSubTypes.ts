export enum PubSubTopic {
    firestore_backup = "firestore_backup",
    firestore_export_bigquery = "firestore_export_bigquery",
    process_mailchimp_email_recipients = "process_mailchimp_email_recipients",
    bridge_to_monday_prune = "bridge_to_monday_prune",
    unsubscriber_sync = "unsubscriber_sync",
    slack_command = "slack_command",
    create_daily_sent_prompts = "create_daily_sent_prompts",
}


export interface CampaignRecipientJobPayload {
    campaignId: string,
    reflectionPromptId?: string
}
