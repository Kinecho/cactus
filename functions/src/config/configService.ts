import * as functions from "firebase-functions"
import {Environment, getEnvironment} from "@api/config/environmentManager";

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
    return functions.config() as CactusConfig
}

function buildMockConfig():CactusConfig {
    return {
        mailchimp: {api_key: "fake_key-us20", audience_id: "testing"},
        slack: {
            webhooks: {
                cactus_activity: "https://cactus_activity_webhook.test.com"
            }
        }
    }
}