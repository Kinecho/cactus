export interface ServiceAccountCredentials {
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

export interface CactusConfig {
    isEmulator: boolean,
    app: {
        environment: string
    },
    mailchimp: {
        api_key: string,
        audience_id: string,
        bridge_to_monday_segment_id: number,
    },
    sentry: {
        api_token: string,
        functions_dsn:string,
        release?: string,
    },
    slack: {
        webhooks: {
            cactus_activity: string,
        },
        channels: {
            engineering: string,
            general: string,
            activity: string,
            data_log: string,
            ci: string,
            [key: string] : string,
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
        bigquery_dataset_id: string,
    }
    firestore_backups_service_account: ServiceAccountCredentials
    bigquery_service_account: ServiceAccountCredentials
    dynamic_links: {
        domain: string,
        prefix: string,
    },
    web: {
        domain: string,
    },
    ios: {
        bundle_id: string,
    },
    sendgrid: {
        api_key: string,
        template_ids: {
            magic_link: string,
            magic_link_new_user: string,
        }
    },
    sheets: {
        client_id: string,
        client_secret: string,
        prompt_content_sheet_id: string,
        service_account: ServiceAccountCredentials,
    },
    flamelink: {
        service_account: ServiceAccountCredentials,
        robot_user_id: string,
        environments: {
            prod_id: string,
            stage_id: string,
            dev_id: string,
        }
    }
}