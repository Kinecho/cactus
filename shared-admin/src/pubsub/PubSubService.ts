import {PubSub} from "@google-cloud/pubsub";
import {CactusConfig} from "@shared/CactusConfig";

export class PubSubService {
    protected static sharedInstance: PubSubService;
    pubsub: PubSub;

    static getSharedInstance(): PubSubService {
        if (!PubSubService.getSharedInstance) {
            throw new Error("PubSubService has not been initialized.")
        }
        return PubSubService.sharedInstance;
    }

    static initialize(config: CactusConfig) {
        PubSubService.sharedInstance = new PubSubService(config);
    }

    constructor(config: CactusConfig) {
        this.pubsub = new PubSub();
    }
}