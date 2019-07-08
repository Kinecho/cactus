export interface CactusConfig {
    isEmulator: boolean,
    mailchimp: {
        api_key: string,
        audience_id: string,
    },
    slack: {
        webhooks: {
            cactus_activity: string,
        },
        channels: {
            engineering: string,
            general: string,
            activity: string,
        }
        app: {
            app_id: string,
            client_id: string,
            client_secret: string,
            signing_secret: string,
            verification_token: string,
            oauth_access_token: string,
            bot_user_access_token: string,
        }
    },
    stripe: {
        api_key: string,
        secret_key: string,
    },
    backups_config: {
        analytics_project_id: string,
        bigquery_import_bucket: string,
        firestore_backups_bucket: string,
    }
    firestore_backups_service_account: {
        project_id: string,
        token_uri: string,
        auth_uri: string,
        client_email: string,
        auth_provider_x509_cert_url: string,
        type: string,
        client_id: string,
        private_key: string,
        client_x509_cert_url: string,
        private_key_id: string
    }
}