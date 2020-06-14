import { CactusConfig } from "@shared/CactusConfig";
import CactusMember from "@shared/models/CactusMember";

const bizSdk = require('facebook-nodejs-business-sdk');
const ServerEvent = bizSdk.ServerEvent;
const EventRequest = bizSdk.EventRequest;
const UserData = bizSdk.UserData;
const CustomData = bizSdk.CustomData;
// const Content = bizSdk.Content;

export default class AdminFacebookAdsService {
    static shared: AdminFacebookAdsService;

    static getSharedConfig() {
        if (!AdminFacebookAdsService.shared) {
            throw new Error("The AdminFacebookAdsService has not been intialized.")
        }
        return AdminFacebookAdsService.shared;
    }

    static initalize(config: CactusConfig) {
        AdminFacebookAdsService.shared = new AdminFacebookAdsService(config);
    }

    config: CactusConfig;
    api:any;

    constructor(config: CactusConfig) {
        this.config = config;
        this.api = bizSdk.FacebookAdsApi.init(config.facebook.access_token);
    }

    get accessToken(): string {
        return this.config.facebook.access_token;
    }

    get pixelId(): string {
        return this.config.facebook.web_pixel_id;
    }

    sendEvent(eventName: string, member: CactusMember, priceDollars?: number, currency: string="usd") {
        let current_timestamp = Math.floor(Date.now() / 1000);

        const userData = (new UserData()).setEmail(member.email)
            // .setFbp('fb.1.1558571054389.1098115397')
        // .setFbc('fb.1.1554763741205.AbCdEfGhIjKlMnOpQrStUvWxYz1234567890');

        let serverEvent = (new ServerEvent())
        .setEventName(eventName)
        .setEventTime(current_timestamp)
        .setUserData(userData)

        if (priceDollars) {
            const customData = (new CustomData())
            .setCurrency(currency)
            .setValue(priceDollars);
            serverEvent = serverEvent.setCustomData(customData);
        }

        const eventsData = [serverEvent];
        const eventRequest = (new EventRequest(this.accessToken, this.pixelId))
        .setEvents(eventsData);

        eventRequest.execute();
    }


}