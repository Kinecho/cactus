import _axios, { AxiosInstance } from "axios";
import {
    apiDomain,
    getPlatformHeader,
    getSubscriberAttributes,
    processAttributeInputForUpdate,
    RevenueCatEndpoints
} from "@shared/api/RevenueCatApi";
import { Config } from "@web/config";
import CactusMember from "@shared/models/CactusMember";
import { getAppType } from "@web/DeviceUtil";
import Logger from "@shared/Logger"
import { isAxiosError } from "@shared/api/ApiTypes";

const logger = new Logger("RevenueCatService");


export default class RevenueCatService {
    static shared: RevenueCatService = new RevenueCatService();

    client: AxiosInstance;

    constructor() {
        const apiToken = Config.revenueCatApiKey;
        this.client = _axios.create({
            baseURL: apiDomain,
            headers: {
                'Authorization': `Bearer ${ apiToken }`,
                "Content-Type": "application/json",
            }
        });
    }

    /**
     * Tell RevenueCat the user has engaged with the website/app
     *
     * @param {CactusMember} member - the Cactus Member update
     * @return {Promise<void>}
     */
    async updateLastSeen(member: CactusMember) {
        try {
            const memberId = member?.id;
            if (!memberId) {
                return;
            }
            const appType = getAppType();
            const headers = getPlatformHeader(appType);
            await this.client.get(RevenueCatEndpoints.subscriber(memberId), { headers: { ...headers } });

            await this.updateAttributes(member);
        } catch (error) {
            logger.error("Unexpected error when updating RevenueCat member activity", error);
        }
    }

    /**
     * Set attributes on the subscriber in RevenueCat. Can pass any attributes as strings or numbers.
     * Null values or empty strings will clear the attribute;
     * @param {CactusMember} member
     *
     * @return {Promise<void>}
     */
    async updateAttributes(member?: CactusMember): Promise<void> {
        const memberId = member?.id;
        if (!memberId) {
            return;
        }
        try {
            const path = RevenueCatEndpoints.subscriberAttributes(memberId);
            const params = getSubscriberAttributes(member);
            const attributes = processAttributeInputForUpdate(params);
            if (!attributes) {
                return;
            }
            await this.client.post(path, { attributes });
        } catch (error) {
            if (isAxiosError(error)) {
                logger.error("Failed to update RevenueCat user attributes", error.response?.data ?? error);
            } else {
                logger.error("Failed to update RevenueCat user attributes", error);
            }
        }
    }
}