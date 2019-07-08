export interface CactusConfig {
    isEmulator: boolean,
    mailchimp: {
        api_key: string,
        audience_id: string,
    },
    slack: {
        webhooks: {
            cactus_activity: string,
        }
    },
    stripe: {
        api_key: string,
        secret_key: string,
    }
    dynamic_links: {
        domain: string,
        prefix: string,
    },
    web: {
        domain: string,
    }
}