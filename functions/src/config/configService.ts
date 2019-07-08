import * as functions from "firebase-functions"
import {Environment, getEnvironment} from "@api/config/environmentManager";
import {CactusConfig} from "@api/config/CactusConfig";

let _config:CactusConfig;

export enum PubSubTopic {
    firestore_backup = "firestore_backup"
}

export function getConfig():CactusConfig{
    //used for testing purposes
    if (getEnvironment() === Environment.test) {
        return buildMockConfig();
    }

    if (!_config){
        _config = buildConfig()
    }

    return _config
}

function buildConfig():CactusConfig {
    const config = functions.config() as CactusConfig;

    config.isEmulator = process.env.IS_EMULATOR === "true";

    return config;
}

function buildMockConfig():CactusConfig {
    return {
        isEmulator: true,
        mailchimp: {api_key: "fake_key-us20", audience_id: "testing"},
        slack: {
            webhooks: {
                cactus_activity: "https://cactus_activity_webhook.test.com"
            },
            channels: {
                general: "general-test",
                engineering: "engineering-test",
                activity: "cactus-activity-test"
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
            firestore_backups_bucket: "fake-backup-bucket"
        }
    }
}