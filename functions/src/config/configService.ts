import * as functions from "firebase-functions"
import {Environment, getEnvironment} from "@api/config/environmentManager";
import {CactusConfig} from "@shared/CactusConfig";

let _config: CactusConfig;
let _testConfigOverrides: Partial<CactusConfig> = {};

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

function buildConfig(): CactusConfig {
    const functionsConfig = functions.config() as CactusConfig;

    const config = {...functionsConfig};

    config.isEmulator = process.env.IS_EMULATOR === "true";
    if (config.isEmulator) {
        config.app.environment = "dev";
        config.web.domain = "localhost:8080";
    }

    return config;
}

export function setTestConfig(config: Partial<CactusConfig>) {
    _testConfigOverrides = config;
}

export function resetTestConfig() {
    _testConfigOverrides = {};
}

const defaultTestConfig: CactusConfig = {
    isEmulator: true,
    mailchimp: {
        api_key: "fake_key-us20",
        audience_id: "testing",
        bridge_to_monday_segment_id: 1234
    },
    app: {
        environment: "test"
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
        secret_key: "test_secret_key"
    },
    dynamic_links: {
        domain: "cactus-app-stage.web.app",
        prefix: "",
    },
    web: {
        domain: "cactus-app-stage.web.app",
    },
    ios: {
        bundle_id: "com.cactus.TestApp"
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
        template_ids: {
            magic_link: "1234",
            magic_link_new_user: '1234ra',
        }
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
        environments: {
            prod_id: "production",
            stage_id: "stage",
            dev_id: "dev",
        },
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
    }
};

function buildMockConfig(): CactusConfig {
    return {...defaultTestConfig, ..._testConfigOverrides};
}