import SecurityService from "@api/SecurityService";
import Logger from "@shared/Logger"

const crypto = require("crypto");
const logger = new Logger("SecurityService.test");

const Data = {
    signature: "MEUCIEJV9mjasgYQMJLoZTPgHww0laxlXwR8AjAiezlLp3vNAiEAz8Mo5AKH33lnJBt5wcn12gfK2X3hLhfOOV2BkhwHqdg=",
    publicKey: "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE4FOaQZJBIHYOlVwFteqt3L2EkYQvSI9ZxlnPzCigUbON79BBsydcWQZogQampPDiFv6hB1nNb1/nHf1RhSCN5A==",
    timeStamp: "1592435350",
    rawBody: "[{\"email\":\"example@test.com\",\"timestamp\":1592435149,\"smtp-id\":\"\u003c14c5d75ce93.dfd.64b469@ismtpd-555\u003e\",\"event\":\"processed\",\"category\":[\"cat facts\"],\"sg_event_id\":\"G4Kr_WXkNOj7fRyXeUtUGA==\",\"sg_message_id\":\"14c5d75ce93.dfd.64b469.filter0001.16648.5515E0B88.0\"},{\"email\":\"example@test.com\",\"timestamp\":1592435149,\"smtp-id\":\"\u003c14c5d75ce93.dfd.64b469@ismtpd-555\u003e\",\"event\":\"deferred\",\"category\":[\"cat facts\"],\"sg_event_id\":\"nKg8u1NDYXJRXmzaxH1liQ==\",\"sg_message_id\":\"14c5d75ce93.dfd.64b469.filter0001.16648.5515E0B88.0\",\"response\":\"400 try again later\",\"attempt\":\"5\"},{\"email\":\"example@test.com\",\"timestamp\":1592435149,\"smtp-id\":\"\u003c14c5d75ce93.dfd.64b469@ismtpd-555\u003e\",\"event\":\"delivered\",\"category\":[\"cat facts\"],\"sg_event_id\":\"VSLUsDbr8h4a2Y6KpduYRg==\",\"sg_message_id\":\"14c5d75ce93.dfd.64b469.filter0001.16648.5515E0B88.0\",\"response\":\"250 OK\"},{\"email\":\"example@test.com\",\"timestamp\":1592435149,\"smtp-id\":\"\u003c14c5d75ce93.dfd.64b469@ismtpd-555\u003e\",\"event\":\"open\",\"category\":[\"cat facts\"],\"sg_event_id\":\"Xd2JG8frysTHncXYShy48w==\",\"sg_message_id\":\"14c5d75ce93.dfd.64b469.filter0001.16648.5515E0B88.0\",\"useragent\":\"Mozilla/4.0 (compatible; MSIE 6.1; Windows XP; .NET CLR 1.1.4322; .NET CLR 2.0.50727)\",\"ip\":\"255.255.255.255\"},{\"email\":\"example@test.com\",\"timestamp\":1592435149,\"smtp-id\":\"\u003c14c5d75ce93.dfd.64b469@ismtpd-555\u003e\",\"event\":\"click\",\"category\":[\"cat facts\"],\"sg_event_id\":\"hg0SHdJRspW-ZaVI3CyikQ==\",\"sg_message_id\":\"14c5d75ce93.dfd.64b469.filter0001.16648.5515E0B88.0\",\"useragent\":\"Mozilla/4.0 (compatible; MSIE 6.1; Windows XP; .NET CLR 1.1.4322; .NET CLR 2.0.50727)\",\"ip\":\"255.255.255.255\",\"url\":\"http://www.sendgrid.com/\"},{\"email\":\"example@test.com\",\"timestamp\":1592435149,\"smtp-id\":\"\u003c14c5d75ce93.dfd.64b469@ismtpd-555\u003e\",\"event\":\"bounce\",\"category\":[\"cat facts\"],\"sg_event_id\":\"SDgDiMR1k-dm-_rmNkc89A==\",\"sg_message_id\":\"14c5d75ce93.dfd.64b469.filter0001.16648.5515E0B88.0\",\"reason\":\"500 unknown recipient\",\"status\":\"5.0.0\"},{\"email\":\"example@test.com\",\"timestamp\":1592435149,\"smtp-id\":\"\u003c14c5d75ce93.dfd.64b469@ismtpd-555\u003e\",\"event\":\"dropped\",\"category\":[\"cat facts\"],\"sg_event_id\":\"HnwNZ7xy69KtIjxH4GqL7Q==\",\"sg_message_id\":\"14c5d75ce93.dfd.64b469.filter0001.16648.5515E0B88.0\",\"reason\":\"Bounced Address\",\"status\":\"5.0.0\"},{\"email\":\"example@test.com\",\"timestamp\":1592435149,\"smtp-id\":\"\u003c14c5d75ce93.dfd.64b469@ismtpd-555\u003e\",\"event\":\"spamreport\",\"category\":[\"cat facts\"],\"sg_event_id\":\"zxvrZ1mzabKL8JgBYaX-hQ==\",\"sg_message_id\":\"14c5d75ce93.dfd.64b469.filter0001.16648.5515E0B88.0\"},{\"email\":\"example@test.com\",\"timestamp\":1592435149,\"smtp-id\":\"\u003c14c5d75ce93.dfd.64b469@ismtpd-555\u003e\",\"event\":\"unsubscribe\",\"category\":[\"cat facts\"],\"sg_event_id\":\"UGqgITtUIgHTQSMYiiP6HQ==\",\"sg_message_id\":\"14c5d75ce93.dfd.64b469.filter0001.16648.5515E0B88.0\"},{\"email\":\"example@test.com\",\"timestamp\":1592435149,\"smtp-id\":\"\u003c14c5d75ce93.dfd.64b469@ismtpd-555\u003e\",\"event\":\"group_unsubscribe\",\"category\":[\"cat facts\"],\"sg_event_id\":\"79-zmpw4DHgYVD8_IKLlIw==\",\"sg_message_id\":\"14c5d75ce93.dfd.64b469.filter0001.16648.5515E0B88.0\",\"useragent\":\"Mozilla/4.0 (compatible; MSIE 6.1; Windows XP; .NET CLR 1.1.4322; .NET CLR 2.0.50727)\",\"ip\":\"255.255.255.255\",\"url\":\"http://www.sendgrid.com/\",\"asm_group_id\":10},{\"email\":\"example@test.com\",\"timestamp\":1592435149,\"smtp-id\":\"\u003c14c5d75ce93.dfd.64b469@ismtpd-555\u003e\",\"event\":\"group_resubscribe\",\"category\":[\"cat facts\"],\"sg_event_id\":\"ZBpbMNafmDtIGLewzg630g==\",\"sg_message_id\":\"14c5d75ce93.dfd.64b469.filter0001.16648.5515E0B88.0\",\"useragent\":\"Mozilla/4.0 (compatible; MSIE 6.1; Windows XP; .NET CLR 1.1.4322; .NET CLR 2.0.50727)\",\"ip\":\"255.255.255.255\",\"url\":\"http://www.sendgrid.com/\",\"asm_group_id\":10}]",
}

test("node verify", async () => {
    logger.info("Hashes", crypto.getHashes())

    const verified = await SecurityService.shared.nodeVerify(Data.rawBody, Data.timeStamp, Data.signature, Data.publicKey);
    expect(verified).toBeDefined();

})

test("elliptic verify", async () => {
    const verified = await SecurityService.shared.verifyEC(`${ Data.timeStamp }${ Data.rawBody }`, Data.signature, Data.publicKey);
    expect(verified).toBeDefined();

})

test("body buffer conversion", () => {
    const body = "this is the original body";

    const buf = SecurityService.shared.bodyStringToBuffer(body);
    expect(buf instanceof Buffer).toBeTruthy();

    const bufBack = SecurityService.shared.bodyBufferToString(buf);
    expect(typeof (bufBack)).toEqual("string");
    expect(bufBack).toEqual(body);
})