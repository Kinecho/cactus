import FlamelinkService, { EntryObserverOptions } from "@web/services/FlamelinkService";
import { ListenerUnsubscriber } from "@web/services/FirestoreService";
import AppSettings from "@shared/models/AppSettings";
import Logger from "@shared/Logger";

export default class AppSettingsService {
    public static sharedInstance = new AppSettingsService();
    flamelinkService = FlamelinkService.sharedInstance;
    logger = new Logger("AppSettingsService");
    settingsUnsubscriber: ListenerUnsubscriber;
    currentSettings: AppSettings | null = null;

    constructor() {
        this.settingsUnsubscriber = this.observeAppSettings({
            onData: (settings, error) => {
                if (error) {
                    this.logger.error("Failed to get app settings", error);
                } else if (settings) {
                    this.currentSettings = settings;
                    this.logger.info("current settings", settings);
                } else {
                    this.logger.warn("No settings were returned from the settings observer");
                }
            }
        })
    }

    /**
     * Returns the current app settings, if they exist. If not, this will fetch the settings from the database.
     * @return {Promise<AppSettings>}
     */
    async getCurrentSettings(): Promise<AppSettings | undefined> {
        if (this.currentSettings) {
            return this.currentSettings;
        } else {
            return this.fetchAppSettings();
        }
    }

    /**
     * Get a fresh copy of AppSettings from the database. Executes a query every time.
     * @return {Promise<AppSettings | undefined>}
     */
    async fetchAppSettings(): Promise<AppSettings | undefined> {
        const queryResults = await this.flamelinkService.getAll(AppSettings);
        if (queryResults.results.length > 0) {
            const [appSettings] = queryResults.results;
            return appSettings;
        }
        return undefined;
    }

    /**
     * Add a new observer for app settings.
     * NOTE: Generally, you shouldn't use this, and instead use `await currentSettings()`
     * @param {EntryObserverOptions<AppSettings>} options
     * @return {ListenerUnsubscriber}
     */
    observeAppSettings(options: EntryObserverOptions<AppSettings>): ListenerUnsubscriber {
        return this.flamelinkService.observeSingle(AppSettings, options)
    }

}



