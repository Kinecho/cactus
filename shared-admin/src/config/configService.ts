import * as functions from "firebase-functions"
import { Environment, getEnvironment } from "@admin/config/environmentManager";
import { CactusConfig } from "@admin/CactusConfig";

let _config: CactusConfig;
let _testConfigOverrides: Partial<CactusConfig> = {};

export function setConfig(config: CactusConfig) {
    _config = config;
}

export function getConfig(): CactusConfig {
    //used for testing purposes
    const env = getEnvironment();

    if (env === Environment.test) {
        return buildMockConfig();
    }

    if (!_config) {
        _config = buildConfig()
    }

    return _config
}

export function getHostname(config: CactusConfig = _config): string {
    return `${ config.web.protocol }://${ config.web.domain }`
}

export function buildConfig(configInput: CactusConfig = functions.config() as CactusConfig): CactusConfig {
    // const functionsConfig = functions.config() as CactusConfig;

    const config = { ...configInput };
    config.app.serverName = process.env.FUNCTION_NAME || process.env.K_SERVICE || undefined;
    config.isEmulator = process.env.IS_EMULATOR === "true";
    if (config.isEmulator) {
        config.app.environment = "dev";
        config.web.domain = "localhost:8080";
        config.web.protocol = 'http';
        // config.stripe.webhook_signing_secrets.main = 'whsec_CQrDcQTFgTr01NtFT4vNI5HawMGX9oHs';
        config.stripe.webhook_signing_secrets.main = 'whsec_skI0PA8KSH2BZWmJEcODQGf6FgEHJEB2';
        config.tasks.handler_url_base = "http://cactus-api.ngrok.io/cactus-app-stage/us-central1/tasks";
    } else {
        config.web.protocol = 'https'
    }

    config.allowedOrigins = ["https://cactus.app", "https://cactus-app-stage.web.app", "https://cactus-app-prod.web.app", /localhost:*/, /cactus-web.ngrok.io/];
    return config;
}

export function setTestConfig(config: Partial<CactusConfig>) {
    _testConfigOverrides = config;
}

export function resetTestConfig() {
    _testConfigOverrides = {};
}

export function isNonPromptCampaignId(campaignId: string): boolean {
    const idString = getConfig().mailchimp.non_prompt_campaign_ids;
    return idString.split(",").map(id => id.trim()).includes(campaignId);
}

const defaultTestConfig: CactusConfig = {
    isEmulator: true,
    android_publisher: {
        default_package_name: "app.cactus.stage",
        service_account: {
            type: "service_account",
            project_id: "cactus-app-stage",
            private_key_id: "id123",
            private_key: "-----BEGIN PRIVATE KEY-----\nFAKE PRIVATE KEY\n-----END PRIVATE KEY-----\n",
            client_email: "firestore-backups@cactus-app-stage.iam.gserviceaccount.com",
            client_id: "fake_id",
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
            client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firestore-backups%40cactus-app-stage.iam.gserviceaccount.com"
        },
    },
    allowedOrigins: ["https://cactus.app", "https://cactus-app-stage.web.app", "https://cactus-app-prod.web.app", /localhost:*/],
    mailchimp: {
        api_key: "fake_key-us20",
        audience_id: "testing",
        bridge_to_monday_segment_id: "1234",
        non_prompt_campaign_ids: "507974de98",
        segment_id_all_tiers: "12345",
        segment_id_plus_tier: "12345",
        templates: {
            prompt_module_morning: "12345"
        }
    },
    app: {
        environment: "test",
        serverName: "test_env",
        fake_email_domain: "private.cactus.app"
    },
    sentry: {
        api_token: "myapitoken",
        functions_dsn: "mydsn",
        release: "testrelease"
    },
    slack: {
        webhooks: {
            cactus_activity: "https://cactus_activity_webhook.test.com"
        },
        channels: {
            general: "general-test",
            engineering: "engineering-test",
            activity: "cactus-activity-test",
            data_log: "data-log-test",
            ci: "engineering-ci",
        },
        app: {
            app_id: "fake",
            client_id: "fake",
            client_secret: "fake",
            signing_secret: "fake",
            verification_token: "fake",
            oauth_access_token: "fake",
            bot_user_access_token: "fake",
        }
    },
    stripe: {
        api_key: "test_api_key",
        secret_key: "test_secret_key",
        webhook_signing_secrets: {
            checkout_session_completed: "test_secret_key",
            main: "main_test_secret",
        }
    },
    dynamic_links: {
        domain: "cactus-app-stage.web.app",
        prefix: "",
    },
    web: {
        domain: "cactus-app-stage.web.app",
        protocol: "https"
    },
    ios: {
        bundle_id: "com.cactus.TestApp",
        team_id: "XYZ123",
        app_id: "XYZ123.com.cactus.TestApp",
        custom_scheme: "app.cactus-stage",
        verify_receipt_url: "https://sandbox.itunes.apple/verifyReceipt",
        verify_receipt_sandbox_url: "https://sandbox.itunes.apple/verifyReceipt",
        iap_shared_secret: "test-key"
    },
    bigquery_service_account: {
        "type": "service_account",
        "project_id": "analytics",
        "private_key_id": "id123",
        "private_key": "-----BEGIN PRIVATE KEY-----\nFAKE PRIVATE KEY\n-----END PRIVATE KEY-----\n",
        "client_email": "firestore-backups@cactus-app-stage.iam.gserviceaccount.com",
        "client_id": "fake_id",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firestore-backups%40cactus-app-stage.iam.gserviceaccount.com"
    },
    firestore_backups_service_account: {
        "type": "service_account",
        "project_id": "cactus-app-stage",
        "private_key_id": "id123",
        "private_key": "-----BEGIN PRIVATE KEY-----\nFAKE PRIVATE KEY\n-----END PRIVATE KEY-----\n",
        "client_email": "firestore-backups@cactus-app-stage.iam.gserviceaccount.com",
        "client_id": "fake_id",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firestore-backups%40cactus-app-stage.iam.gserviceaccount.com"
    },
    backups_config: {
        analytics_project_id: "fake-project-1222",
        bigquery_import_bucket: "fake-bigquery-bucket",
        firestore_backups_bucket: "fake-backup-bucket",
        bigquery_dataset_id: "fake_dataset_id",
    },
    sendgrid: {
        api_key: "test-api-key",
        webhook_verification_key: "testkey",
        templates: {
            new_prompt_notification: {
                template_id: "test_template_id",
                unsubscribe_group_id: "14282"
            },
            magic_link_new_user: {
                template_id: "test_template_id"
            },
            magic_link: {
                template_id: "test_template_id"
            },
            data_export: {
                template_id: "test_template_id"
            },
            trial_ending: {
                template_id: "test_template_id"
            },
            friend_request: {
                template_id: "test_template_id"
            },
            invitation: {
                template_id: "test_template_id"
            }
        }
    },
    language: {
        client_id: "test",
        client_secret: "test",
        service_account: {
            type: "service_account",
            project_id: "cactus-app-stage",
            private_key_id: "id123",
            private_key: "-----BEGIN PRIVATE KEY-----\nFAKE PRIVATE KEY\n-----END PRIVATE KEY-----\n",
            client_email: "firestore-backups@cactus-app-stage.iam.gserviceaccount.com",
            client_id: "fake_id",
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
            client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firestore-backups%40cactus-app-stage.iam.gserviceaccount.com"
        },
    },
    sheets: {
        client_id: "test",
        client_secret: "test",
        prompt_content_sheet_id: "test",
        service_account: {
            type: "service_account",
            project_id: "cactus-app-stage",
            private_key_id: "id123",
            private_key: "-----BEGIN PRIVATE KEY-----\nFAKE PRIVATE KEY\n-----END PRIVATE KEY-----\n",
            client_email: "firestore-backups@cactus-app-stage.iam.gserviceaccount.com",
            client_id: "fake_id",
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
            client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firestore-backups%40cactus-app-stage.iam.gserviceaccount.com"
        },
    },
    flamelink: {
        robot_user_id: "1234",
        environment_id: "dev",
        service_account: {
            type: "service_account",
            project_id: "cactus-app-stage",
            private_key_id: "id123",
            private_key: "-----BEGIN PRIVATE KEY-----\nFAKE PRIVATE KEY\n-----END PRIVATE KEY-----\n",
            client_email: "firestore-backups@cactus-app-stage.iam.gserviceaccount.com",
            client_id: "fake_id",
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
            client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firestore-backups%40cactus-app-stage.iam.gserviceaccount.com"
        },
    },
    revenuecat: {
        public_key: "public_key",
        secret_key: "secret_key",
        webhook_bearer_token: "test_bearer_token",
        app_id: "1234",
    },
    tasks: {
        project_id: "cactus-app-stage",
        location: "us-central1",
        handler_url_base: "https://us-central1-cactus-app-stage.cloudfunctions.net/tasks",
        queues: {
            daily_prompt_setup: {
                name: "daily-prompt-setup",
                handler_path: "/daily-prompt-setup",
                http_method: "POST"
            },
            daily_prompt_push: {
                name: "daily-prompt-push",
                handler_path: "/daily-prompt-push",
                http_method: "POST"
            },
            daily_prompt_email: {
                name: "daily-prompt-email",
                handler_path: "/daily-prompt-email",
                http_method: "POST"
            }
        },
    },
    watson: {
        tone_analyzer: {
            api_key: "test_key",
            api_url: "https://api.us-south.tone-analyzer.cloud"
        }
    }
};

export function buildMockConfig(): CactusConfig {
    return { ...defaultTestConfig, ..._testConfigOverrides };
}