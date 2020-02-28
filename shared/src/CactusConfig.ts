import {SendgridTemplate} from "@shared/models/EmailLog";

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

export type EnvironmentType = "test" | "dev" | "prod" | "stage"
export type SendgridTemplateConfig = { [name in SendgridTemplate]: string };

export interface CactusConfig {
    isEmulator: boolean,
    allowedOrigins: (string | RegExp)[],
    app: {
        serverName: string | undefined
        environment: EnvironmentType,
        fake_email_domain: string
    },
    mailchimp: {
        api_key: string,
        audience_id: string,
        bridge_to_monday_segment_id: string,
        non_prompt_campaign_ids: string //this is a comma separated string
        segment_id_all_tiers: string,
        segment_id_plus_tier: string,
        templates: {
            prompt_module_morning: string
        }
    },
    sentry: {
        api_token: string,
        functions_dsn: string,
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
            [key: string]: string,
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
        webhook_signing_secrets: {
            checkout_session_completed: string,
            main: string,
        }
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
        protocol: string,
    },
    ios: {
        bundle_id: string,
        team_id: string,
        app_id: string,
        custom_scheme: string,
    },
    sendgrid: {
        api_key: string,
        template_ids: SendgridTemplateConfig,
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
        environment_id: string,
    }
}