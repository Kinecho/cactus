import {CactusConfig} from "@shared/CactusConfig";

interface AppleAppSiteAssociation {
    applinks: {
        apps: string[],
        details: {
            appID: string,
            paths: string[]
        }[]
    }
}

export function getAppSiteConfig(config: CactusConfig): AppleAppSiteAssociation {
    return {
        applinks: {
            apps: [],
            details: [
                {
                    appID: config.ios.app_id,
                    paths: [
                        "NOT /_/*",
                        "/auth-actions",
                        "/auth-actions/*",
                        "/reflection/*",
                        "/prompts/*",
                        "/home"
                    ]
                }
            ]
        }
    }
}