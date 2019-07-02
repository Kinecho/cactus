import * as functions from "firebase-functions"
import {Environment, getEnvironment} from "@api/config/environmentManager";
import {CactusConfig} from "@shared/CactusConfig";

let _config:CactusConfig;

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
            }
        },
        stripe: {
            api_key: "test_api_key",
            secret_key: "test_secret_key",
        },
        dynamic_links: {
            domain: "cactus-app-stage.web.app",
            prefix: "",
        },
        web: {
            domain: "cactus-app-stage.web.app",
        }
    }
}