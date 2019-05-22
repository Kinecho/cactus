interface CactusConfig {
    mailchimp: {
        api_key: string,
    },
    slack: {
        webhooks: {
            cactus_activity: string,
        }
    }
}