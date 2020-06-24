import Logger from "@shared/Logger"
const EventWebhook = require('@sendgrid/eventwebhook');
const logger = new Logger("SecurityService");

export default class CryptoService {
    static shared = new CryptoService();

    verifySendgrid(body: string | Buffer |any, timestamp: string, signature: string, validationKey: string): boolean {
        const webhook = new EventWebhook();
        const publicKey = webhook.convertPublicKeyToECDSA(validationKey);
        const verified = webhook.verifySignature(publicKey, body, signature, timestamp);

        logger.info("Webhook verified", verified)
        return verified;
    }

}