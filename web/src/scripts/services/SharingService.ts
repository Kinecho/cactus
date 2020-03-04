import Logger from "@shared/Logger";

const logger = new Logger("SharingService");

class SharingService {
    static sharedInstance =new SharingService();

    static canShareNatively(): boolean {
        return !!navigator.share
    }

    /**
     * Share a link usingi the native share api, if supported
     * @param {{title?: string; url?: string; text?: string}} options
     * @return {Promise<boolean>} returns true if the link was successfully shared.
     */
    static async shareLinkNatively(options: {title?: string, url?: string, text?: string}): Promise<boolean> {
        if (!navigator.share) {
            return false
        }

        try {
            await navigator.share(options);
        } catch  (error) {
            logger.error("SharingService: an error occurred trying to share a link", error);
            return false
        }

        return true;
    }

}

export default SharingService