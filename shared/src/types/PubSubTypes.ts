export enum PubSubTopic {
    firestore_backup = "firestore_backup",
    firestore_export_bigquery = "firestore_export_bigquery",
    process_mailchimp_email_recipients = "process_mailchimp_email_recipients",
}


export interface CampaignRecipientJobPayload {
    campaignId: string,
    reflectionPromptId?: string
}
