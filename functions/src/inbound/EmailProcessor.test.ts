import {
    getSenderFromHeaders,
    getMailchimpEmailIdFromBody,
    processAttachments,
    processBodyHeaders, getMailchimpCampaignIdFromBody, getLinks, getReplyTextContent, processEmail
} from "@api/inbound/EmailProcessor";
import EmailHeaders, {Header} from "@shared/models/EmailHeaders";
import realBody from "./test_data/emailBody1";
import scottEmail from "./test_data/emailBody2";
import * as nonMailchimp from "./test_data/email3";
import * as promptInEmail from "./test_data/email_prompt_in_to";
import EmailReply from "@shared/models/EmailReply";


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
        const headers: EmailHeaders = {};
        expect(getSenderFromHeaders(headers)).toBeNull();
    });

    test("Authentication results is present", () => {
        const headers: EmailHeaders = {
            [Header.AUTHENTICATION_RESULTS]: "mx.google.com; dkim=pass header.i=@anecdotal-co.20150623.gappssmtp.com header.s=20150623 header.b=fvgI1v7k; spf=pass (google.com: domain of neil@kinecho.com designates 209.85.220.41 as permitted sender) smtp.mailfrom=neil@kinecho.com"
        };
        expect(getSenderFromHeaders(headers)).toBe("neil@kinecho.com");
    });

    test("with semicolon", () => {
        const headers: EmailHeaders = {
            [Header.AUTHENTICATION_RESULTS]: "mx.google.com; dkim=pass header.i=@anecdotal-co.20150623.gappssmtp.com header.s=20150623 header.b=fvgI1v7k; spf=pass (google.com: domain of neil@kinecho.com designates 209.85.220.41 as permitted sender) smtp.mailfrom=neil@kinecho.com;  "
        };
        expect(getSenderFromHeaders(headers)).toBe("neil@kinecho.com");
    });

    test("Authentication with shit at the end of the string", () => {
        const headers: EmailHeaders = {
            [Header.AUTHENTICATION_RESULTS]: "mx.google.com; dkim=pass header.i=@anecdotal-co.20150623.gappssmtp.com header.s=20150623 header.b=fvgI1v7k; spf=pass (google.com: domain of neil@kinecho.com designates 209.85.220.41 as permitted sender) smtp.mailfrom=neil@kinecho.com; alkdfj a alkjdflaksjdflj"
        };
        expect(getSenderFromHeaders(headers)).toBe("neil@kinecho.com");
    });
});

describe("get userId from body", () => {
    test("simple string body with param", () => {
        const body = "this is a body https://list-manage.com/test?e=myid&t=test";

        expect(getMailchimpEmailIdFromBody(body)).toBe("myid");
    });

    test("multiple urls in body  string body with param", () => {
        const body = "this is a body \n \t http://list-manage.com/test/p=testing \n <br/> https://list-manage.com/test?e=myid&t=test";

        expect(getMailchimpEmailIdFromBody(body)).toBe("myid");
    });

    test("non-whitelisited emails are skipped", () => {
        const body = "this is a body \n \t http://list.com/test/p=testing \n <br/> https://bad.com/test?e=myid&t=test";

        expect(getMailchimpEmailIdFromBody(body)).toBe(undefined);
    });

    test("no param found", () => {
        const body = "this is a body \n \t http://google.com/test/p=testing \n <br/> https://cactus.app/test?ei=myid&t=test";

        expect(getMailchimpEmailIdFromBody(body)).toBeUndefined();
    });

    test("real body", () => {
        expect(getMailchimpEmailIdFromBody(realBody)).toBe("b6b0b79489");
    });

    test("real body, campaign", () => {
        expect(getMailchimpCampaignIdFromBody(realBody)).toBe("ff07f954f5");
    });


    test("scott's email body, user id", () => {
        const [first] = getLinks(scottEmail, true);
        expect(first).toBe("https://app.us20.list-manage.com/track/click?u=3D676af7cc149986a=aec398daa7&id=3Dc36e8dec43&e=3D0bcd131ced");
    });

    test("scott's email body, user id", () => {
        expect(getMailchimpEmailIdFromBody(scottEmail)).toBe("3D0bcd131ced");
    });

    test("scott's email body, campaign", () => {
        expect(getMailchimpCampaignIdFromBody(scottEmail)).toBe("3D66d7a69778");
    });


    // test("blighe's email body, user id", () => {
    //     const [first] = getLinks(blitheFailedEmail, true);
    //     expect(first).toBe("https://app.us20.list-manage.com/track/click?u=3D676af7cc149986a=aec398daa7&id=3Dc36e8dec43&e=3D0bcd131ced");
    // });
});


describe("get links test", () => {
    test("single link with &amp;", () => {
        const input = "hello https://google.com/hello?test=hello&amp;key=value";
        const [link] = getLinks(input);
        expect(link).toBe("https://google.com/hello?test=hello&key=value");
    });
});

describe('parse reply', () => {
    test("with replies", () => {
        const email = new EmailReply({});
        email.content.text = "\n" +
            "fewer replies\n" +
            "\n" +
            "On Mon, Jun 10, 2019 at 4:59 AM Cactus <hello@cactus.app> wrote:\n" +
            "\n" +
            "> Hi Neil,\n" +
            "> *Today’s Question*\n" +
            "> What actions do you take to show someone you love them?\n" +
            ">\n" +
            "> Go deeper on this reflection →\n" +
            "> <https://app.us20.list-manage.com/track/click?u=676af7cc149986aaec398daa7&id=e5624054cf&e=b6b0b79489>\n" +
            ">\n" +
            "> You can reply with your thoughts or, \"Done!\" to let me know you've\n" +
            "> reflected.\n" +
            ">\n" +
            "> Happy Monday,\n" +
            "> Your friend, Cactus\n" +
            ">\n" +
            "> Want to share Cactus with a friend? Send them this link\n" +
            "> <https://app.us20.list-manage.com/track/click?u=676af7cc149986aaec398daa7&id=c73a703e45&e=b6b0b79489>\n" +
            "> .\n" +
            ">\n" +
            ">\n" +
            "> Don't want these emails anymore? Unsubscribe here\n" +
            "> <https://app.us20.list-manage.com/unsubscribe?u=676af7cc149986aaec398daa7&id=c70b4b8de0&e=b6b0b79489&c=ff07f954f5>\n" +
            "> .\n" +
            ">\n" +
            "\n";
        const reply = getReplyTextContent(email);
        expect(reply).toBe("fewer replies");
    });

    test("use email parser to get text and html replies", async () => {
        const email = await processEmail(nonMailchimp.headers, nonMailchimp.body);
        expect(email).not.toBeNull();
        if (!email) {
            return;
        }
        const textReply = getReplyTextContent(email);
        expect(textReply).toEqual("this is my answer");
    });
});

describe("process email", () => {
    test("busboy", async () => {
        const email = await processEmail(nonMailchimp.busboyHeaders, nonMailchimp.busboyBody);
        console.log("processed email", email);
        expect(email).not.toBeNull();
        if (email === null) {
            return;
        }
        expect(email.subject).toBe("super beta file");
    });

    test("real body", async () => {
        const email = await processEmail(nonMailchimp.headers, nonMailchimp.body);
        expect(email).not.toBeNull();
        if (email === null) {
            return;
        }
        expect(email.subject).toBe("Re: When do you feel deep satisfaction?");
        expect(email.mailchimpCampaignId).toEqual("fc05fe6559");
        expect(email.replyText).toEqual("this is my answer");
        expect(email.mailchimpUniqueEmailId).toEqual("b6b0b79489");
        expect(email.content.text).toEqual('this is my answer\r\n\r\nOn Thu, Jun 13, 2019 at 2:44 AM Cactus <hello@cactus.app> wrote:\r\n\r\n> Hi Neil,\r\n> *Today’s Question*\r\n> When do you feel deep satisfaction?\r\n>\r\n> Go deeper on this reflection →\r\n> <https://app.us20.list-manage.com/track/click?u=676af7cc149986aaec398daa7&id=8f96c56d20&e=b6b0b79489>\r\n>\r\n> You can reply with your thoughts or, "Done!" to let me know you\'ve\r\n> reflected.\r\n>\r\n> Happy Thursday,\r\n> Your friend, Cactus\r\n>\r\n> Want to share Cactus with a friend? Send them this link\r\n> <https://app.us20.list-manage.com/track/click?u=676af7cc149986aaec398daa7&id=68421a044c&e=b6b0b79489>\r\n> .\r\n>\r\n>\r\n> Don\'t want these emails anymore? Unsubscribe here\r\n> <https://app.us20.list-manage.com/unsubscribe?u=676af7cc149986aaec398daa7&id=c70b4b8de0&e=b6b0b79489&c=fc05fe6559>\r\n> .\r\n>\r\n')
        expect(email.content.html).toEqual('<div dir="ltr">this is my answer</div><br><div class="gmail_quote"><div dir="ltr" class="gmail_attr">On Thu, Jun 13, 2019 at 2:44 AM Cactus &lt;hello@cactus.app&gt; wrote:<br></div><blockquote class="gmail_quote" style="margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex"><u></u>\r\n\r\n    \r\n        \r\n        \r\n        \r\n        \r\n        \r\n        \r\n\r\n    \r\n    <div style="background:none 50% 50%/cover no-repeat rgb(255,255,255);height:100%;margin:0px;padding:0px;width:100%">\r\n        \r\n        <center>\r\n            <table align="center" border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="gmail-m_-4542431557683367020bodyTable" style="background:none 50% 50%/cover no-repeat rgb(255,255,255);border-collapse:collapse;height:100%;margin:0px;padding:0px;width:100%">\r\n                <tbody><tr>\r\n                    <td align="left" valign="top" id="gmail-m_-4542431557683367020bodyCell" style="height:100%;margin:0px;padding:10px;width:100%;border-top:0px">\r\n                        \r\n                        \r\n                        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="gmail-m_-4542431557683367020templateContainer" style="border-collapse:collapse;border:0px;max-width:600px">\r\n                            <tbody><tr>\r\n                                <td valign="top" id="gmail-m_-4542431557683367020templateHeader" style="border-top:0px;border-bottom:0px"></td>\r\n                            </tr>\r\n                            <tr>\r\n                                <td valign="top" id="gmail-m_-4542431557683367020templateBody" style="border-top:0px;border-bottom:0px"><table border="0" cellpadding="0" cellspacing="0" width="100%" class="gmail-m_-4542431557683367020mcnTextBlock" style="min-width:100%;border-collapse:collapse">\r\n    <tbody class="gmail-m_-4542431557683367020mcnTextBlockOuter">\r\n        <tr>\r\n            <td valign="top" class="gmail-m_-4542431557683367020mcnTextBlockInner" style="padding-top:9px">\r\n              \t\r\n\t\t\t\r\n\t\t\t\t\r\n                <table align="left" border="0" cellpadding="0" cellspacing="0" style="max-width:100%;min-width:100%;border-collapse:collapse" width="100%" class="gmail-m_-4542431557683367020mcnTextContentContainer">\r\n                    <tbody><tr>\r\n\r\n                        <td valign="top" class="gmail-m_-4542431557683367020mcnTextContent" style="padding:0px 18px 9px;word-break:break-word;color:rgb(32,32,32);font-family:Helvetica;font-size:16px;line-height:150%;text-align:left">\r\n<span style="white-space:pre-wrap">Hi Neil,</span>\r\n                        </td>\r\n                    </tr>\r\n                </tbody></table>\r\n\t\t\t\t\r\n\r\n\t\t\t\t\r\n            </td>\r\n        </tr>\r\n    </tbody>\r\n</table><table border="0" cellpadding="0" cellspacing="0" width="100%" class="gmail-m_-4542431557683367020mcnTextBlock" style="min-width:100%;border-collapse:collapse">\r\n    <tbody class="gmail-m_-4542431557683367020mcnTextBlockOuter">\r\n        <tr>\r\n            <td valign="top" class="gmail-m_-4542431557683367020mcnTextBlockInner" style="padding-top:9px">\r\n              \t\r\n\t\t\t\r\n\t\t\t\t\r\n                <table align="left" border="0" cellpadding="0" cellspacing="0" style="max-width:100%;min-width:100%;border-collapse:collapse" width="100%" class="gmail-m_-4542431557683367020mcnTextContentContainer">\r\n                    <tbody><tr>\r\n\r\n                        <td valign="top" class="gmail-m_-4542431557683367020mcnTextContent" style="padding:0px 18px 9px;word-break:break-word;color:rgb(32,32,32);font-family:Helvetica;font-size:16px;line-height:150%;text-align:left">\r\n\r\n                            <span><u><strong>Today’s Question</strong></u><br>\r\nWhen do you feel deep satisfaction?</span><br>\r\n<br>\r\n<a href="https://app.us20.list-manage.com/track/click?u=676af7cc149986aaec398daa7&amp;id=8f96c56d20&amp;e=b6b0b79489" style="color:rgb(0,124,137);font-weight:normal;text-decoration:underline" target="_blank"><span>Go deeper on this reflection →</span></a><br>\r\n \r\n                        </td>\r\n                    </tr>\r\n                </tbody></table>\r\n\t\t\t\t\r\n\r\n\t\t\t\t\r\n            </td>\r\n        </tr>\r\n    </tbody>\r\n</table><table border="0" cellpadding="0" cellspacing="0" width="100%" class="gmail-m_-4542431557683367020mcnTextBlock" style="min-width:100%;border-collapse:collapse">\r\n    <tbody class="gmail-m_-4542431557683367020mcnTextBlockOuter">\r\n        <tr>\r\n            <td valign="top" class="gmail-m_-4542431557683367020mcnTextBlockInner" style="padding-top:9px">\r\n              \t\r\n\t\t\t\r\n\t\t\t\t\r\n                <table align="left" border="0" cellpadding="0" cellspacing="0" style="max-width:100%;min-width:100%;border-collapse:collapse" width="100%" class="gmail-m_-4542431557683367020mcnTextContentContainer">\r\n                    <tbody><tr>\r\n\r\n                        <td valign="top" class="gmail-m_-4542431557683367020mcnTextContent" style="padding:0px 18px 9px;word-break:break-word;color:rgb(32,32,32);font-family:Helvetica;font-size:16px;line-height:150%;text-align:left">\r\n\r\n                            You can reply with your thoughts or, &quot;Done!&quot; to let me know you&#39;ve reflected.<br>\r\n<br>\r\nHappy Thursday,<br>\r\nYour friend, Cactus<br>\r\n<br>\r\n<span>Want to share Cactus with a friend? Send them <a href="https://app.us20.list-manage.com/track/click?u=676af7cc149986aaec398daa7&amp;id=68421a044c&amp;e=b6b0b79489" style="color:rgb(0,124,137);font-weight:normal;text-decoration:underline" target="_blank">this link</a>.</span>\r\n                        </td>\r\n                    </tr>\r\n                </tbody></table>\r\n\t\t\t\t\r\n\r\n\t\t\t\t\r\n            </td>\r\n        </tr>\r\n    </tbody>\r\n</table></td>\r\n                            </tr>\r\n                            <tr>\r\n                                <td valign="top" id="gmail-m_-4542431557683367020templateFooter" style="border-top:0px;border-bottom:0px"><table border="0" cellpadding="0" cellspacing="0" width="100%" class="gmail-m_-4542431557683367020mcnTextBlock" style="min-width:100%;border-collapse:collapse">\r\n    <tbody class="gmail-m_-4542431557683367020mcnTextBlockOuter">\r\n        <tr>\r\n            <td valign="top" class="gmail-m_-4542431557683367020mcnTextBlockInner" style="padding-top:9px">\r\n              \t\r\n\t\t\t\r\n\t\t\t\t\r\n                <table align="left" border="0" cellpadding="0" cellspacing="0" style="max-width:100%;min-width:100%;border-collapse:collapse" width="100%" class="gmail-m_-4542431557683367020mcnTextContentContainer">\r\n                    <tbody><tr>\r\n\r\n                        <td valign="top" class="gmail-m_-4542431557683367020mcnTextContent" style="padding:0px 18px 9px;word-break:break-word;color:rgb(32,32,32);font-family:Helvetica;font-size:12px;line-height:150%;text-align:left">\r\n\r\n                            <br>\r\n<br>\r\n<span style="color:rgb(169,169,169)">Don&#39;t want these emails anymore?</span><span style="color:rgb(169,169,169)"> </span><span style="color:rgb(128,128,128)"><a href="https://app.us20.list-manage.com/unsubscribe?u=676af7cc149986aaec398daa7&amp;id=c70b4b8de0&amp;e=b6b0b79489&amp;c=fc05fe6559" style="color:rgb(32,32,32);font-weight:normal;text-decoration:underline" target="_blank">Unsubscribe here</a>.</span>\r\n                        </td>\r\n                    </tr>\r\n                </tbody></table>\r\n\t\t\t\t\r\n\r\n\t\t\t\t\r\n            </td>\r\n        </tr>\r\n    </tbody>\r\n</table></td>\r\n                            </tr>\r\n                        </tbody></table>\r\n                        \r\n                        \r\n                    </td>\r\n                </tr>\r\n            </tbody></table>\r\n        </center>\r\n    <img src="https://app.us20.list-manage.com/track/open.php?u=676af7cc149986aaec398daa7&amp;id=fc05fe6559&amp;e=b6b0b79489" height="1" width="1"></div>\r\n</blockquote></div>\r\n');
        expect(email.from).toEqual({
            email: 'neil@kinecho.com',
            name: 'Neil Poulin',
            local: 'neil',
            domain: 'kinecho.com'
        });

        expect(email.to).toEqual({
            email: 'test@test.myfleck.com',
            name: null,
            local: 'test',
            domain: 'test.myfleck.com'
        });
        expect(email.envelope).toEqual({
            to: [{
                email: 'test@test.myfleck.com',
                name: null,
                local: 'test',
                domain: 'test.myfleck.com'
            }],
            from:
                {
                    email: 'neil@kinecho.com',
                    name: null,
                    local: 'neil',
                    domain: 'kinecho.com'
                }
        })
    });

    test("firebase", async () => {
        const email = await processEmail(nonMailchimp.firebaseHeaders, nonMailchimp.firebaseBody);
        console.log("processed email", email);
        expect(email).not.toBeNull();
        if (email === null) {
            return;
        }
        expect(email.from).toEqual({
            email: "neil@kinecho.com",
            name: "Neil Poulin",
            domain: "kinecho.com",
            local: "neil"
        });
    });

    test("prompt in email", async () => {
        const email = await processEmail(promptInEmail.headers, promptInEmail.body);
        console.log("processed email", email);
        expect(email).not.toBeNull();
        if (email === null) {
            return;
        }
        expect(email.reflectionPromptId).toEqual("P6iR5hBc7nLezSZV66dA");

        expect(email.from).toEqual({
            email: "neil@neilpoulin.com",
            name: "Neil Poulin",
            domain: "neilpoulin.com",
            local: "neil"
        });
    })
});