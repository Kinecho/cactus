import Logger from "@shared/Logger"

const crypto = require("crypto");
const atob = require("atob");
const EC = require("elliptic").ec;
const logger = new Logger("SecurityService");
const ec = new EC("curve25519"); //got both x and y values - still failed

export default class SecurityService {
    static shared = new SecurityService();

    bodyStringToBuffer(bodyInput: string): Buffer {
        return Buffer.from(bodyInput, "utf8");
    }

    stringToSha256Hash(bodyInput: string): Buffer {
        return crypto.createHash("sha256").update(bodyInput).digest();
    }

    bodyBufferToString(bodyBuffer: Buffer): string {
        return bodyBuffer.toString("utf8");
    }

    async nodeVerify(body_input_string: string | Buffer, timestamp: string, signature_input_string: string, publicKey_string: string): Promise<boolean> {
        const verify = crypto.createVerify("SHA256");
        const hashed = this.stringToSha256Hash(`${ timestamp }${ body_input_string }`);
        verify.update(hashed);
        // verify.update(body_input_string)
        verify.end()
        const pemkey = `-----BEGIN PUBLIC KEY-----\n${ publicKey_string }\n-----END PUBLIC KEY-----`
        return verify.verify(pemkey, atob(signature_input_string));

    }

    async verifyEC(body_input_string: string, signature_input_string: string, publicKey_string: string): Promise<boolean> {
        // const pub = await this.digestPublicKey(publicKey_string)
        // logger.info("Pub digest = ", pub);
        const key = ec.keyFromPublic(Buffer.from(publicKey_string, "base64"));
        logger.info("key", key);
        logger.info("key.x", key.pub.x)
        logger.info("key.y", key.pub.y);
        const body = this.stringToSha256Hash(body_input_string)
        const verified = key.verify(body, Buffer.from(signature_input_string, "base64"))
        logger.info("Key verification - is verified:", verified);
        return verified;
    }

}