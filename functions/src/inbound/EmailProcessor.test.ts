import {
    getSenderFromHeaders,
    getMailchimpEmailIdFromBody,
    processAttachments,
    processBodyHeaders, getMailchimpCampaignIdFromBody
} from "@api/inbound/EmailProcessor";
import EmailHeaders, {Header} from "@api/inbound/models/EmailHeaders";


const realBody = "--xYzZY\n" +
    "Content-Disposition: form-data; name=\"headers\"\n" +
    "\n" +
    "Received: by mx0026p1mdw1.sendgrid.net with SMTP id DTAH65nfxA Tue, 11 Jun 2019 02:15:29 +0000 (UTC)\n" +
    "Received: from mail-yb1-f176.google.com (mail-yb1-f176.google.com [209.85.219.176]) by mx0026p1mdw1.sendgrid.net (Postfix) with ESMTPS id 96EB9745036 for <test@test.myfleck.com>; Tue, 11 Jun 2019 02:15:29 +0000 (UTC)\n" +
    "Received: by mail-yb1-f176.google.com with SMTP id v17so4590008ybm.2 for <test@test.myfleck.com>; Mon, 10 Jun 2019 19:15:29 -0700 (PDT)\n" +
    "DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=kinecho-com.20150623.gappssmtp.com; s=20150623; h=mime-version:references:in-reply-to:from:date:message-id:subject:to; bh=wcdPM/mlHHPpg3K3IeTjLt9uj7iYlqrIYYKzfnREl+M=; b=iMgxlTywa1i+eBmJNg/TjdygFWLDA3g4aYGRj7pkkuPuQCtbux0bhv8Z8nJ9yqsfFJ 500xucjBWvqbH0veoCV8ZFsNAz03Cyi2oUDsT/NggL6nVnkI4pHOm/eM42pOBu0qlNnV W2jgtW35jN1T96/thgVTRwBW7eYsmKDk6d35DALKA8NGpzu364GT3of0KyfLb04FGLeY YHoUx/YmXMJhOddPvGoZCmEaMWPUowSsN8HlpyM0QLQVXx+SMphC5xFqS12/Um5jwfqm dEypx2Sl2TfNwKSZ613zPsBTj/mX7ZabqoSAOqMFMN0rVlfEovkO/7i2a215yEy6/FXH FeIw==\n" +
    "X-Google-DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=1e100.net; s=20161025; h=x-gm-message-state:mime-version:references:in-reply-to:from:date :message-id:subject:to; bh=wcdPM/mlHHPpg3K3IeTjLt9uj7iYlqrIYYKzfnREl+M=; b=q7BKbQ4UViuc3SwMu8AD8fXadZjbvv/Nn8MtZU1s20bVa3oSs5wpgrkQiJjEmV34nJ 8AWQzRvfJYGZ6hwqxNWum/FCirtp37B0N3zUUzjWr0OaKx7W+UFO/5xJOcLfOlGKXhfw CAyDz0fa17CEk3T1Dj2VH2E/CWipAviuzTLFt4YKKg5qYE5oRO7mVq7+CbQG2HIsoaQw B9+AIc+jGWBkc7Wp5rz8BMluwk8DtuAcXq/oqrh7tnQ7ZEwsg4L5iPCzKZf4uaG+BQAs QI5ZViXlYlJO4YPkydtEZtxe0CxR4PdylFaiPhVDvFgrI0xyfajNLIvF4cg+dJLWn58v jODg==\n" +
    "X-Gm-Message-State: APjAAAVk8uqBSXJwD2Zm7gTYS7ubFN8piPQjwWROTHd5QS3Wo938zlH+ d7P+Leg1cWv6DSqMkTUgsu4w1Ul2AVlHn5Ziu5jf4nToUeM=\n" +
    "X-Google-Smtp-Source: APXvYqxfoUU/R/tRXpqKRS5UYK4WTzd6q4x1akX44pD0mCJl0p5jA/IsalNMgsMxptTlbB0IW+vVSRqUzc4GMcfizvE=\n" +
    "X-Received: by 2002:a25:d8d5:: with SMTP id p204mr33287694ybg.93.1560219328975; Mon, 10 Jun 2019 19:15:28 -0700 (PDT)\n" +
    "MIME-Version: 1.0\n" +
    "References: <676af7cc149986aaec398daa7.b6b0b79489.20190610085920.ff07f954f5.ade7f76e@mail220.suw16.rsgsv.net>\n" +
    "In-Reply-To: <676af7cc149986aaec398daa7.b6b0b79489.20190610085920.ff07f954f5.ade7f76e@mail220.suw16.rsgsv.net>\n" +
    "From: Neil Poulin <neil@kinecho.com>\n" +
    "Date: Mon, 10 Jun 2019 22:15:18 -0400\n" +
    "Message-ID: <CABT1paJWDssyAsDok9-EmCQwrcDXbcuoRWuY4EzbafrM7GdxvA@mail.gmail.com>\n" +
    "Subject: Re: What actions do you take to show someone you love them?\n" +
    "To: test@test.myfleck.com\n" +
    "Content-Type: multipart/alternative; boundary=\"000000000000e0358f058b02deeb\"\n" +
    "\n" +
    "--xYzZY\n" +
    "Content-Disposition: form-data; name=\"attachments\"\n" +
    "\n" +
    "0\n" +
    "--xYzZY\n" +
    "Content-Disposition: form-data; name=\"dkim\"\n" +
    "\n" +
    "{@kinecho-com.20150623.gappssmtp.com : pass}\n" +
    "--xYzZY\n" +
    "Content-Disposition: form-data; name=\"subject\"\n" +
    "\n" +
    "Re: What actions do you take to show someone you love them?\n" +
    "--xYzZY\n" +
    "Content-Disposition: form-data; name=\"to\"\n" +
    "\n" +
    "test@test.myfleck.com\n" +
    "--xYzZY\n" +
    "Content-Disposition: form-data; name=\"html\"\n" +
    "\n" +
    "<div dir=\"ltr\">fewer replies</div><br><div class=\"gmail_quote\"><div dir=\"ltr\" class=\"gmail_attr\">On Mon, Jun 10, 2019 at 4:59 AM Cactus &lt;hello@cactus.app&gt; wrote:<br></div><blockquote class=\"gmail_quote\" style=\"margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex\"><u></u>\n" +
    "\n" +
    "    \n" +
    "        \n" +
    "        \n" +
    "        \n" +
    "        \n" +
    "        \n" +
    "        \n" +
    "\n" +
    "    \n" +
    "    <div style=\"background:none 50% 50%/cover no-repeat rgb(255,255,255);height:100%;margin:0px;padding:0px;width:100%\">\n" +
    "        \n" +
    "        <center>\n" +
    "            <table align=\"center\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" height=\"100%\" width=\"100%\" id=\"gmail-m_-7070082040527216256bodyTable\" style=\"background:none 50% 50%/cover no-repeat rgb(255,255,255);border-collapse:collapse;height:100%;margin:0px;padding:0px;width:100%\">\n" +
    "                <tbody><tr>\n" +
    "                    <td align=\"left\" valign=\"top\" id=\"gmail-m_-7070082040527216256bodyCell\" style=\"height:100%;margin:0px;padding:10px;width:100%;border-top:0px\">\n" +
    "                        \n" +
    "                        \n" +
    "                        <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" class=\"gmail-m_-7070082040527216256templateContainer\" style=\"border-collapse:collapse;border:0px;max-width:600px\">\n" +
    "                            <tbody><tr>\n" +
    "                                <td valign=\"top\" id=\"gmail-m_-7070082040527216256templateHeader\" style=\"border-top:0px;border-bottom:0px\"></td>\n" +
    "                            </tr>\n" +
    "                            <tr>\n" +
    "                                <td valign=\"top\" id=\"gmail-m_-7070082040527216256templateBody\" style=\"border-top:0px;border-bottom:0px\"><table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" class=\"gmail-m_-7070082040527216256mcnTextBlock\" style=\"min-width:100%;border-collapse:collapse\">\n" +
    "    <tbody class=\"gmail-m_-7070082040527216256mcnTextBlockOuter\">\n" +
    "        <tr>\n" +
    "            <td valign=\"top\" class=\"gmail-m_-7070082040527216256mcnTextBlockInner\" style=\"padding-top:9px\">\n" +
    "              \t\n" +
    "\t\t\t\n" +
    "\t\t\t\t\n" +
    "                <table align=\"left\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:100%;min-width:100%;border-collapse:collapse\" width=\"100%\" class=\"gmail-m_-7070082040527216256mcnTextContentContainer\">\n" +
    "                    <tbody><tr>\n" +
    "\n" +
    "                        <td valign=\"top\" class=\"gmail-m_-7070082040527216256mcnTextContent\" style=\"padding:0px 18px 9px;word-break:break-word;color:rgb(32,32,32);font-family:Helvetica;font-size:16px;line-height:150%;text-align:left\">\n" +
    "<span style=\"white-space:pre-wrap\">Hi Neil,</span>\n" +
    "                        </td>\n" +
    "                    </tr>\n" +
    "                </tbody></table>\n" +
    "\t\t\t\t\n" +
    "\n" +
    "\t\t\t\t\n" +
    "            </td>\n" +
    "        </tr>\n" +
    "    </tbody>\n" +
    "</table><table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" class=\"gmail-m_-7070082040527216256mcnTextBlock\" style=\"min-width:100%;border-collapse:collapse\">\n" +
    "    <tbody class=\"gmail-m_-7070082040527216256mcnTextBlockOuter\">\n" +
    "        <tr>\n" +
    "            <td valign=\"top\" class=\"gmail-m_-7070082040527216256mcnTextBlockInner\" style=\"padding-top:9px\">\n" +
    "              \t\n" +
    "\t\t\t\n" +
    "\t\t\t\t\n" +
    "                <table align=\"left\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:100%;min-width:100%;border-collapse:collapse\" width=\"100%\" class=\"gmail-m_-7070082040527216256mcnTextContentContainer\">\n" +
    "                    <tbody><tr>\n" +
    "\n" +
    "                        <td valign=\"top\" class=\"gmail-m_-7070082040527216256mcnTextContent\" style=\"padding:0px 18px 9px;word-break:break-word;color:rgb(32,32,32);font-family:Helvetica;font-size:16px;line-height:150%;text-align:left\">\n" +
    "\n" +
    "                            <span><u><strong>Today’s Question</strong></u><br>\n" +
    "What actions do you take to show someone you love them?</span><br>\n" +
    "<br>\n" +
    "<a href=\"https://app.us20.list-manage.com/track/click?u=676af7cc149986aaec398daa7&amp;id=e5624054cf&amp;e=b6b0b79489\" style=\"color:rgb(0,124,137);font-weight:normal;text-decoration:underline\" target=\"_blank\"><span>Go deeper on this reflection →</span></a><br>\n" +
    " \n" +
    "                        </td>\n" +
    "                    </tr>\n" +
    "                </tbody></table>\n" +
    "\t\t\t\t\n" +
    "\n" +
    "\t\t\t\t\n" +
    "            </td>\n" +
    "        </tr>\n" +
    "    </tbody>\n" +
    "</table><table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" class=\"gmail-m_-7070082040527216256mcnTextBlock\" style=\"min-width:100%;border-collapse:collapse\">\n" +
    "    <tbody class=\"gmail-m_-7070082040527216256mcnTextBlockOuter\">\n" +
    "        <tr>\n" +
    "            <td valign=\"top\" class=\"gmail-m_-7070082040527216256mcnTextBlockInner\" style=\"padding-top:9px\">\n" +
    "              \t\n" +
    "\t\t\t\n" +
    "\t\t\t\t\n" +
    "                <table align=\"left\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:100%;min-width:100%;border-collapse:collapse\" width=\"100%\" class=\"gmail-m_-7070082040527216256mcnTextContentContainer\">\n" +
    "                    <tbody><tr>\n" +
    "\n" +
    "                        <td valign=\"top\" class=\"gmail-m_-7070082040527216256mcnTextContent\" style=\"padding:0px 18px 9px;word-break:break-word;color:rgb(32,32,32);font-family:Helvetica;font-size:16px;line-height:150%;text-align:left\">\n" +
    "\n" +
    "                            You can reply with your thoughts or, &quot;Done!&quot; to let me know you&#39;ve reflected.<br>\n" +
    "<br>\n" +
    "Happy Monday,<br>\n" +
    "Your friend, Cactus<br>\n" +
    "<br>\n" +
    "<span>Want to share Cactus with a friend? Send them <a href=\"https://app.us20.list-manage.com/track/click?u=676af7cc149986aaec398daa7&amp;id=c73a703e45&amp;e=b6b0b79489\" style=\"color:rgb(0,124,137);font-weight:normal;text-decoration:underline\" target=\"_blank\">this link</a>.</span>\n" +
    "                        </td>\n" +
    "                    </tr>\n" +
    "                </tbody></table>\n" +
    "\t\t\t\t\n" +
    "\n" +
    "\t\t\t\t\n" +
    "            </td>\n" +
    "        </tr>\n" +
    "    </tbody>\n" +
    "</table></td>\n" +
    "                            </tr>\n" +
    "                            <tr>\n" +
    "                                <td valign=\"top\" id=\"gmail-m_-7070082040527216256templateFooter\" style=\"border-top:0px;border-bottom:0px\"><table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" class=\"gmail-m_-7070082040527216256mcnTextBlock\" style=\"min-width:100%;border-collapse:collapse\">\n" +
    "    <tbody class=\"gmail-m_-7070082040527216256mcnTextBlockOuter\">\n" +
    "        <tr>\n" +
    "            <td valign=\"top\" class=\"gmail-m_-7070082040527216256mcnTextBlockInner\" style=\"padding-top:9px\">\n" +
    "              \t\n" +
    "\t\t\t\n" +
    "\t\t\t\t\n" +
    "                <table align=\"left\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:100%;min-width:100%;border-collapse:collapse\" width=\"100%\" class=\"gmail-m_-7070082040527216256mcnTextContentContainer\">\n" +
    "                    <tbody><tr>\n" +
    "\n" +
    "                        <td valign=\"top\" class=\"gmail-m_-7070082040527216256mcnTextContent\" style=\"padding:0px 18px 9px;word-break:break-word;color:rgb(32,32,32);font-family:Helvetica;font-size:12px;line-height:150%;text-align:left\">\n" +
    "\n" +
    "                            <br>\n" +
    "<br>\n" +
    "<span style=\"color:rgb(169,169,169)\">Don&#39;t want these emails anymore?</span><span style=\"color:rgb(169,169,169)\"> </span><span style=\"color:rgb(128,128,128)\"><a href=\"https://app.us20.list-manage.com/unsubscribe?u=676af7cc149986aaec398daa7&amp;id=c70b4b8de0&amp;e=b6b0b79489&amp;c=ff07f954f5\" style=\"color:rgb(32,32,32);font-weight:normal;text-decoration:underline\" target=\"_blank\">Unsubscribe here</a>.</span>\n" +
    "                        </td>\n" +
    "                    </tr>\n" +
    "                </tbody></table>\n" +
    "\t\t\t\t\n" +
    "\n" +
    "\t\t\t\t\n" +
    "            </td>\n" +
    "        </tr>\n" +
    "    </tbody>\n" +
    "</table></td>\n" +
    "                            </tr>\n" +
    "                        </tbody></table>\n" +
    "                        \n" +
    "                        \n" +
    "                    </td>\n" +
    "                </tr>\n" +
    "            </tbody></table>\n" +
    "        </center>\n" +
    "    <img src=\"https://app.us20.list-manage.com/track/open.php?u=676af7cc149986aaec398daa7&amp;id=ff07f954f5&amp;e=b6b0b79489\" height=\"1\" width=\"1\"></div>\n" +
    "</blockquote></div>\n" +
    "\n" +
    "--xYzZY\n" +
    "Content-Disposition: form-data; name=\"from\"\n" +
    "\n" +
    "Neil Poulin <neil@kinecho.com>\n" +
    "--xYzZY\n" +
    "Content-Disposition: form-data; name=\"text\"\n" +
    "\n" +
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
    "\n" +
    "--xYzZY\n" +
    "Content-Disposition: form-data; name=\"sender_ip\"\n" +
    "\n" +
    "209.85.219.176\n" +
    "--xYzZY\n" +
    "Content-Disposition: form-data; name=\"envelope\"\n" +
    "\n" +
    "{\"to\":[\"test@test.myfleck.com\"],\"from\":\"neil@kinecho.com\"}\n" +
    "--xYzZY\n" +
    "Content-Disposition: form-data; name=\"charsets\"\n" +
    "\n" +
    "{\"to\":\"UTF-8\",\"html\":\"UTF-8\",\"subject\":\"UTF-8\",\"from\":\"UTF-8\",\"text\":\"UTF-8\"}\n" +
    "--xYzZY\n" +
    "Content-Disposition: form-data; name=\"SPF\"\n" +
    "\n" +
    "permerror\n" +
    "--xYzZY--\n";

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
});