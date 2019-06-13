interface CactusConfig {
    isEmulator: boolean,
    mailchimp: {
        api_key: string,
        audience_id: string,
    },
    slack: {
        webhooks: {
            cactus_activity: string,
        }
    }
}