import {
    getSenderFromHeaders,
    getMailchimpEmailIdFromBody,
    processAttachments,
    processBodyHeaders
} from "@api/inbound/EmailProcessor";
import EmailHeaders, {Header} from "@api/inbound/models/EmailHeaders";

describe("processAttachments", () => {
    test("no attachments", () => {
        // expect(processAttachments())
        const input = {};
        const attachments = processAttachments(input);
        expect(attachments).toEqual([]);
    });

    test("no attachments", () => {
        // expect(processAttachments())
        const input = {
            file1: {
                filename: "file1.txt"
            },
            file2: {
                filename: "file2.txt"
            }
        };
        const attachments = processAttachments(input);
        expect(attachments).toEqual([{filename: "file1.txt"}, {filename: "file2.txt"}]);
    });
});

describe("processBodyHeaders", () => {
    test("no headers", () => {
        const input = "";
        const headers = processBodyHeaders(input);
        expect(headers).toEqual({});
    });

    test("one line of headers", () => {
        const input = "test: value";
        const headers = processBodyHeaders(input);
        expect(headers).toEqual({test: "value"});
    });

    test("two lines of headers", () => {
        const input = `
        test: value
        second: test
        `;
        const headers = processBodyHeaders(input);
        expect(headers).toEqual({test: "value", second: "test"});
    });
});

describe("Get sender from headers", () => {
    test("No headers present", () => {
        const headers:EmailHeaders = {};
        expect(getSenderFromHeaders(headers)).toBeNull();
    });

    test("Authentication results is present", () => {
        const headers:EmailHeaders = {
            [Header.AUTHENTICATION_RESULTS]: "mx.google.com; dkim=pass header.i=@anecdotal-co.20150623.gappssmtp.com header.s=20150623 header.b=fvgI1v7k; spf=pass (google.com: domain of neil@kinecho.com designates 209.85.220.41 as permitted sender) smtp.mailfrom=neil@kinecho.com"
        };
        expect(getSenderFromHeaders(headers)).toBe("neil@kinecho.com");
    });

    test("with semicolon", () => {
        const headers:EmailHeaders = {
            [Header.AUTHENTICATION_RESULTS]: "mx.google.com; dkim=pass header.i=@anecdotal-co.20150623.gappssmtp.com header.s=20150623 header.b=fvgI1v7k; spf=pass (google.com: domain of neil@kinecho.com designates 209.85.220.41 as permitted sender) smtp.mailfrom=neil@kinecho.com;  "
        };
        expect(getSenderFromHeaders(headers)).toBe("neil@kinecho.com");
    });

    test("Authentication with shit at the end of the string", () => {
        const headers:EmailHeaders = {
            [Header.AUTHENTICATION_RESULTS]: "mx.google.com; dkim=pass header.i=@anecdotal-co.20150623.gappssmtp.com header.s=20150623 header.b=fvgI1v7k; spf=pass (google.com: domain of neil@kinecho.com designates 209.85.220.41 as permitted sender) smtp.mailfrom=neil@kinecho.com; alkdfj a alkjdflaksjdflj"
        };
        expect(getSenderFromHeaders(headers)).toBe("neil@kinecho.com");
    });
});

describe("get userId from body", () => {
    test("simple string body with param", () => {
        const body = "this is a body https://cactus.app/test?e=myid&t=test";

        expect(getMailchimpEmailIdFromBody(body)).toBe("myid");
    });

    test("multiple urls in body  string body with param", () => {
        const body = "this is a body \n \t http://google.com/test/p=testing \n <br/> https://cactus.app/test?e=myid&t=test";

        expect(getMailchimpEmailIdFromBody(body)).toBe("myid");
    });

    test("no param found", () => {
        const body = "this is a body \n \t http://google.com/test/p=testing \n <br/> https://cactus.app/test?ei=myid&t=test";

        expect(getMailchimpEmailIdFromBody(body)).toBeNull();
    });
});