export default "Delivered-To: hello@cactus.app\n" +
    "Received: by 2002:a0c:a8c9:0:0:0:0:0 with SMTP id h9csp1870240qvc;\n" +
    "        Tue, 11 Jun 2019 07:55:31 -0700 (PDT)\n" +
    "X-Received: by 2002:aca:afc2:: with SMTP id y185mr15214216oie.140.1560264931650;\n" +
    "        Tue, 11 Jun 2019 07:55:31 -0700 (PDT)\n" +
    "ARC-Seal: i=1; a=rsa-sha256; t=1560264931; cv=none;\n" +
    "        d=google.com; s=arc-20160816;\n" +
    "        b=fBd9PyrXaQgrQjlNWe3myMzZT7vwkpFhvzup/wW1u/SMq7EJSEzJORxA20Ym+t71rI\n" +
    "         j+tCjFWl1pYeD37p5IYJZRsKBE0MI8hl6nFEOIZhYi5f92n57h6R1xDDDzZXhcTUJOxs\n" +
    "         mWp3nhNXd3Ow9ioWfVBZzuZjxR0kNwXwpdK5OmB9vNBMIEUg0AmNz4OQXaR1GijVJTja\n" +
    "         cR5RHPbLFH9vL4GswR7G8weDn20zUAlGITMVFOm9naU7Y9VOfPktDJ0Kn7AnFecAfuiC\n" +
    "         JvwKmNc4FyiDMa6d2qNdS5kDhWs/h7tWot+eaqcNsy/cN8UNeVSX6g7xc4y3T3/VWWrt\n" +
    "         yumQ==\n" +
    "ARC-Message-Signature: i=1; a=rsa-sha256; c=relaxed/relaxed; d=google.com; s=arc-20160816;\n" +
    "        h=to:in-reply-to:references:message-id:subject:date:mime-version\n" +
    "         :content-transfer-encoding:from:dkim-signature;\n" +
    "        bh=IBvS4JTYgUXZE7qU5tiwxV/VdFb6qEBBwR4zPTjjiuM=;\n" +
    "        b=dnkJi5jbBD5CPRO/AxUNs6svN+ootc0ml2gJu1MolD+Houp2xrQYM5OmBasEv7uJ4E\n" +
    "         6poOnKUBNv8pqXfkK1HQ2nAEap3xqcZ1qdNDinptGUKZIlPyF64hPjB87umCGOZ95sTi\n" +
    "         qj7+JxKTFvNsg2sPzsKM2bZ63nKHZn+y8yEuBHW46TZyFmZ9fiTNwXVYG2yHGQgEDZdk\n" +
    "         GvgRmMd4kPZ8wR/2BNQ4as3iaztxb203SZfJKN21O53AeEphuEKu6bF3+Ul8pFnE+Rdq\n" +
    "         EXHjstbT6l+1dmBHi0visV0SwYE0DL8sas9uGrogrb/tqxqoeCBK1cLw8qKM9+rce1ba\n" +
    "         RuCw==\n" +
    "ARC-Authentication-Results: i=1; mx.google.com;\n" +
    "       dkim=pass header.i=@gmail.com header.s=20161025 header.b=pvf9oGye;\n" +
    "       spf=pass (google.com: domain of scottrocher@gmail.com designates 209.85.220.41 as permitted sender) smtp.mailfrom=scottrocher@gmail.com;\n" +
    "       dmarc=pass (p=NONE sp=QUARANTINE dis=NONE) header.from=gmail.com\n" +
    "Return-Path: <scottrocher@gmail.com>\n" +
    "Received: from mail-sor-f41.google.com (mail-sor-f41.google.com. [209.85.220.41])\n" +
    "        by mx.google.com with SMTPS id e24sor6263172otk.89.2019.06.11.07.55.31\n" +
    "        for <hello@cactus.app>\n" +
    "        (Google Transport Security);\n" +
    "        Tue, 11 Jun 2019 07:55:31 -0700 (PDT)\n" +
    "Received-SPF: pass (google.com: domain of scottrocher@gmail.com designates 209.85.220.41 as permitted sender) client-ip=209.85.220.41;\n" +
    "Authentication-Results: mx.google.com;\n" +
    "       dkim=pass header.i=@gmail.com header.s=20161025 header.b=pvf9oGye;\n" +
    "       spf=pass (google.com: domain of scottrocher@gmail.com designates 209.85.220.41 as permitted sender) smtp.mailfrom=scottrocher@gmail.com;\n" +
    "       dmarc=pass (p=NONE sp=QUARANTINE dis=NONE) header.from=gmail.com\n" +
    "DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;\n" +
    "        d=gmail.com; s=20161025;\n" +
    "        h=from:content-transfer-encoding:mime-version:date:subject:message-id\n" +
    "         :references:in-reply-to:to;\n" +
    "        bh=IBvS4JTYgUXZE7qU5tiwxV/VdFb6qEBBwR4zPTjjiuM=;\n" +
    "        b=pvf9oGye1B16Vr4aVI+05jPGF9FawIwQ4lZdJ8K2iEORws/dM6qvwo0mfTLQ2rIsqp\n" +
    "         NNaTq4H1lL6c3nAOheymDZVUc405puQIO6x9rKIMzLvfxVrcOz3swMZRHH3CUpGDY819\n" +
    "         DvGLXE2Gt2UckbA6sXTzE1nVD5wrDeQeFrySv7xzAI7Xb5K53CRcHKo8/pdzDxPa4L2C\n" +
    "         X7+8Ve5snDfO+eXihP8/YJvTizE1a92yZyL9gPDXsfnY/cP9KR08GlT/xg8n1zknHBaY\n" +
    "         aPQ6X7hgCj77UL/+X+6/ux+3Yqyhuos6Cr3bKBomM3KsrGJnLmroJkiYlR6d5RbjHDMa\n" +
    "         mi5g==\n" +
    "X-Google-DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;\n" +
    "        d=1e100.net; s=20161025;\n" +
    "        h=x-gm-message-state:from:content-transfer-encoding:mime-version:date\n" +
    "         :subject:message-id:references:in-reply-to:to;\n" +
    "        bh=IBvS4JTYgUXZE7qU5tiwxV/VdFb6qEBBwR4zPTjjiuM=;\n" +
    "        b=M7doNjG0lsx/6x6v0asA8dOTz0N9Nbzu/lTz+D3HR3bko9u9VNLNPtkq4Vl2BBqScq\n" +
    "         Jc0XXLUKgs5BkwOtQpKp3lgOKSl5JeHx4JFs0YWBKHmuuhCykcwVEsviv5tsDSxusreR\n" +
    "         Jh/jcOaxvy1M4EY9e94iu8YTt7+uXYkzgurGLA3wej6PyL1JdLO9s9JPdW2wMrz7dzK3\n" +
    "         Rk2lJ4oDrHr9I/+RtPjiLqZvK23yw7EYL/V84Q5DK87uw9C3Twr/4vekOr3ZuMbCVDqy\n" +
    "         UuvLJEEEgp2LGNYE8H+CtXeRH/hAdrjkq9lRE0p+CY+aDWpPdLZStr/j6VnyI0XYC5+F\n" +
    "         +nxA==\n" +
    "X-Gm-Message-State: APjAAAXu1gunprfiwS17k+GP0+AohYkJ19dQolsXBxHMdroWiLUBPT4N +4YkbEHlifl+6+rMUEyVk+4eHZbEN9E=\n" +
    "X-Google-Smtp-Source: APXvYqxigT45Bza5Agwz9ajSywfPQck1pxj876t96d/Rz/LMbFZozVQDFelrhzoT3XR05bFQKhOghg==\n" +
    "X-Received: by 2002:a9d:3f37:: with SMTP id m52mr34060242otc.181.1560264930425;\n" +
    "        Tue, 11 Jun 2019 07:55:30 -0700 (PDT)\n" +
    "Return-Path: <scottrocher@gmail.com>\n" +
    "Received: from [192.168.1.104] (99-155-38-179.lightspeed.sntcca.sbcglobal.net. [99.155.38.179])\n" +
    "        by smtp.gmail.com with ESMTPSA id p64sm4951813oif.8.2019.06.11.07.55.29\n" +
    "        for <hello@cactus.app>\n" +
    "        (version=TLS1_2 cipher=ECDHE-RSA-AES128-GCM-SHA256 bits=128/128);\n" +
    "        Tue, 11 Jun 2019 07:55:29 -0700 (PDT)\n" +
    "From: Scott Rocher <scottrocher@gmail.com>\n" +
    "Content-Type: multipart/alternative; boundary=Apple-Mail-F02ED38B-55BC-472D-83F2-C35D5A59382F\n" +
    "Content-Transfer-Encoding: 7bit\n" +
    "Mime-Version: 1.0 (1.0)\n" +
    "Date: Tue, 11 Jun 2019 07:55:28 -0700\n" +
    "Subject: Re: What provides you with a sense of belonging? — from Apple Mail on iOS\n" +
    "Message-Id: <16106D9E-5D42-496D-A68C-911D380095A0@gmail.com>\n" +
    "References: <676af7cc149986aaec398daa7.0bcd131ced.20190611091409.66d7a69778.1c488a89@mail94.suw13.rsgsv.net>\n" +
    "In-Reply-To: <676af7cc149986aaec398daa7.0bcd131ced.20190611091409.66d7a69778.1c488a89@mail94.suw13.rsgsv.net>\n" +
    "To: Cactus <hello@cactus.app>\n" +
    "X-Mailer: iPhone Mail (16F203)\n" +
    "\n" +
    "--Apple-Mail-F02ED38B-55BC-472D-83F2-C35D5A59382F\n" +
    "Content-Type: text/plain; charset=utf-8\n" +
    "Content-Transfer-Encoding: quoted-printable\n" +
    "\n" +
    "Done\n" +
    "\n" +
    "> On Jun 11, 2019, at 2:14 AM, Cactus <hello@cactus.app> wrote:\n" +
    ">=20\n" +
    ">=20\n" +
    "> Hi,\n" +
    "> Today=E2=80=99s Question\n" +
    "> What provides you with a sense of belonging?\n" +
    ">=20\n" +
    "> Go deeper on this reflection =E2=86=92\n" +
    "> =20\n" +
    "> You can reply with your thoughts or, \"Done!\" to let me know you've reflec=\n" +
    "ted.\n" +
    ">=20\n" +
    "> Happy Tuesday,\n" +
    "> Your friend, Cactus\n" +
    ">=20\n" +
    "> Want to share Cactus with a friend? Send them this link.\n" +
    ">=20\n" +
    ">=20\n" +
    "> Don't want these emails anymore? Unsubscribe here.\n" +
    "\n" +
    "--Apple-Mail-F02ED38B-55BC-472D-83F2-C35D5A59382F\n" +
    "Content-Type: text/html; charset=utf-8\n" +
    "Content-Transfer-Encoding: quoted-printable\n" +
    "\n" +
    "<html><head><meta http-equiv=3D\"content-type\" content=3D\"text/html; charset=\n" +
    "=3Dutf-8\"></head><body dir=3D\"auto\"><div dir=3D\"ltr\"></div><div dir=3D\"ltr\"=\n" +
    ">Done</div><div dir=3D\"ltr\"><br>On Jun 11, 2019, at 2:14 AM, Cactus &lt;<a =\n" +
    "href=3D\"mailto:hello@cactus.app\">hello@cactus.app</a>&gt; wrote:<br><br></d=\n" +
    "iv><blockquote type=3D\"cite\"><div dir=3D\"ltr\">\n" +
    "\n" +
    "   =20\n" +
    "        <!-- NAME: SIMPLE TEXT -->\n" +
    "        <!--[if gte mso 15]>\n" +
    "        <xml>\n" +
    "            <o:OfficeDocumentSettings>\n" +
    "            <o:AllowPNG/>\n" +
    "            <o:PixelsPerInch>96</o:PixelsPerInch>\n" +
    "            </o:OfficeDocumentSettings>\n" +
    "        </xml>\n" +
    "        <![endif]-->\n" +
    "        <meta charset=3D\"UTF-8\">\n" +
    "        <meta http-equiv=3D\"X-UA-Compatible\" content=3D\"IE=3Dedge\">\n" +
    "        <meta name=3D\"viewport\" content=3D\"width=3Ddevice-width, initial-sc=\n" +
    "ale=3D1\">\n" +
    "        <title>What provides you with a sense of belonging?</title>\n" +
    "\n" +
    "   =20\n" +
    "   =20\n" +
    "        <!--\n" +
    "-->\n" +
    "        <center>\n" +
    "            <table align=3D\"center\" border=3D\"0\" cellpadding=3D\"0\" cellspac=\n" +
    "ing=3D\"0\" height=3D\"100%\" width=3D\"100%\" id=3D\"bodyTable\" style=3D\"backgrou=\n" +
    "nd:#ffffff none no-repeat center/cover;border-collapse: collapse;mso-table-=\n" +
    "lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-s=\n" +
    "ize-adjust: 100%;height: 100%;margin: 0;padding: 0;width: 100%;background-c=\n" +
    "olor: #ffffff;background-image: none;background-repeat: no-repeat;backgroun=\n" +
    "d-position: center;background-size: cover;\">\n" +
    "                <tbody><tr>\n" +
    "                    <td align=3D\"left\" valign=3D\"top\" id=3D\"bodyCell\" style=\n" +
    "=3D\"mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-s=\n" +
    "ize-adjust: 100%;height: 100%;margin: 0;padding: 10px;width: 100%;border-to=\n" +
    "p: 0;\">\n" +
    "                        <!-- BEGIN TEMPLATE // -->\n" +
    "                        <!--[if (gte mso 9)|(IE)]>\n" +
    "                        <table align=3D\"center\" border=3D\"0\" cellspacing=3D=\n" +
    "\"0\" cellpadding=3D\"0\" width=3D\"600\" style=3D\"width:600px;\">\n" +
    "                        <tr>\n" +
    "                        <td align=3D\"center\" valign=3D\"top\" width=3D\"600\" s=\n" +
    "tyle=3D\"width:600px;\">\n" +
    "                        <![endif]-->\n" +
    "                        <table border=3D\"0\" cellpadding=3D\"0\" cellspacing=\n" +
    "=3D\"0\" width=3D\"100%\" class=3D\"templateContainer\" style=3D\"border-collapse:=\n" +
    " collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust:=\n" +
    " 100%;-webkit-text-size-adjust: 100%;border: 0;max-width: 600px !important;=\n" +
    "\">\n" +
    "                            <tbody><tr>\n" +
    "                                <td valign=3D\"top\" id=3D\"templateHeader\" st=\n" +
    "yle=3D\"mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-tex=\n" +
    "t-size-adjust: 100%;border-top: 0;border-bottom: 0;\"></td>\n" +
    "                            </tr>\n" +
    "                            <tr>\n" +
    "                                <td valign=3D\"top\" id=3D\"templateBody\" styl=\n" +
    "e=3D\"mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-=\n" +
    "size-adjust: 100%;border-top: 0;border-bottom: 0;\"><table border=3D\"0\" cell=\n" +
    "padding=3D\"0\" cellspacing=3D\"0\" width=3D\"100%\" class=3D\"mcnTextBlock\" style=\n" +
    "=3D\"min-width: 100%;border-collapse: collapse;mso-table-lspace: 0pt;mso-tab=\n" +
    "le-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;\">\n" +
    "    <tbody class=3D\"mcnTextBlockOuter\">\n" +
    "        <tr>\n" +
    "            <td valign=3D\"top\" class=3D\"mcnTextBlockInner\" style=3D\"padding=\n" +
    "-top: 9px;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-=\n" +
    "text-size-adjust: 100%;\">\n" +
    "              =09<!--[if mso]>\n" +
    "=09=09=09=09<table align=3D\"left\" border=3D\"0\" cellspacing=3D\"0\" cellpaddin=\n" +
    "g=3D\"0\" width=3D\"100%\" style=3D\"width:100%;\">\n" +
    "=09=09=09=09<tr>\n" +
    "=09=09=09=09<![endif]-->\n" +
    "=09=09=09\n" +
    "=09=09=09=09<!--[if mso]>\n" +
    "=09=09=09=09<td valign=3D\"top\" width=3D\"600\" style=3D\"width:600px;\">\n" +
    "=09=09=09=09<![endif]-->\n" +
    "                <table align=3D\"left\" border=3D\"0\" cellpadding=3D\"0\" cellsp=\n" +
    "acing=3D\"0\" style=3D\"max-width: 100%;min-width: 100%;border-collapse: colla=\n" +
    "pse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;=\n" +
    "-webkit-text-size-adjust: 100%;\" width=3D\"100%\" class=3D\"mcnTextContentCont=\n" +
    "ainer\">\n" +
    "                    <tbody><tr>\n" +
    "\n" +
    "                        <td valign=3D\"top\" class=3D\"mcnTextContent\" style=\n" +
    "=3D\"padding-top: 0;padding-right: 18px;padding-bottom: 9px;padding-left: 18=\n" +
    "px;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-si=\n" +
    "ze-adjust: 100%;word-break: break-word;color: #202020;font-family: Helvetic=\n" +
    "a;font-size: 16px;line-height: 150%;text-align: left;\">\n" +
    "Hi,\n" +
    "                        </td>\n" +
    "                    </tr>\n" +
    "                </tbody></table>\n" +
    "=09=09=09=09<!--[if mso]>\n" +
    "=09=09=09=09</td>\n" +
    "=09=09=09=09<![endif]-->\n" +
    "\n" +
    "=09=09=09=09<!--[if mso]>\n" +
    "=09=09=09=09</tr>\n" +
    "=09=09=09=09</table>\n" +
    "=09=09=09=09<![endif]-->\n" +
    "            </td>\n" +
    "        </tr>\n" +
    "    </tbody>\n" +
    "</table><table border=3D\"0\" cellpadding=3D\"0\" cellspacing=3D\"0\" width=3D\"10=\n" +
    "0%\" class=3D\"mcnTextBlock\" style=3D\"min-width: 100%;border-collapse: collap=\n" +
    "se;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-=\n" +
    "webkit-text-size-adjust: 100%;\">\n" +
    "    <tbody class=3D\"mcnTextBlockOuter\">\n" +
    "        <tr>\n" +
    "            <td valign=3D\"top\" class=3D\"mcnTextBlockInner\" style=3D\"padding=\n" +
    "-top: 9px;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-=\n" +
    "text-size-adjust: 100%;\">\n" +
    "              =09<!--[if mso]>\n" +
    "=09=09=09=09<table align=3D\"left\" border=3D\"0\" cellspacing=3D\"0\" cellpaddin=\n" +
    "g=3D\"0\" width=3D\"100%\" style=3D\"width:100%;\">\n" +
    "=09=09=09=09<tr>\n" +
    "=09=09=09=09<![endif]-->\n" +
    "=09=09=09\n" +
    "=09=09=09=09<!--[if mso]>\n" +
    "=09=09=09=09<td valign=3D\"top\" width=3D\"600\" style=3D\"width:600px;\">\n" +
    "=09=09=09=09<![endif]-->\n" +
    "                <table align=3D\"left\" border=3D\"0\" cellpadding=3D\"0\" cellsp=\n" +
    "acing=3D\"0\" style=3D\"max-width: 100%;min-width: 100%;border-collapse: colla=\n" +
    "pse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;=\n" +
    "-webkit-text-size-adjust: 100%;\" width=3D\"100%\" class=3D\"mcnTextContentCont=\n" +
    "ainer\">\n" +
    "                    <tbody><tr>\n" +
    "\n" +
    "                        <td valign=3D\"top\" class=3D\"mcnTextContent\" style=\n" +
    "=3D\"padding-top: 0;padding-right: 18px;padding-bottom: 9px;padding-left: 18=\n" +
    "px;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-si=\n" +
    "ze-adjust: 100%;word-break: break-word;color: #202020;font-family: Helvetic=\n" +
    "a;font-size: 16px;line-height: 150%;text-align: left;\">\n" +
    "\n" +
    "                            <span style=3D\"font-size:Default Size\"><u><stro=\n" +
    "ng>Today=E2=80=99s Question</strong></u><br>\n" +
    "What provides you with a sense of belonging?</span><br>\n" +
    "<br>\n" +
    "<a href=3D\"https://app.us20.list-manage.com/track/click?u=3D676af7cc149986a=\n" +
    "aec398daa7&amp;id=3Dc36e8dec43&amp;e=3D0bcd131ced\" target=3D\"_blank\" style=\n" +
    "=3D\"mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-s=\n" +
    "ize-adjust: 100%;color: #007C89;font-weight: normal;text-decoration: underl=\n" +
    "ine;\"><span style=3D\"font-size:Default Size\">Go deeper on this reflection =\n" +
    "=E2=86=92</span></a><br>\n" +
    "&nbsp;\n" +
    "                        </td>\n" +
    "                    </tr>\n" +
    "                </tbody></table>\n" +
    "=09=09=09=09<!--[if mso]>\n" +
    "=09=09=09=09</td>\n" +
    "=09=09=09=09<![endif]-->\n" +
    "\n" +
    "=09=09=09=09<!--[if mso]>\n" +
    "=09=09=09=09</tr>\n" +
    "=09=09=09=09</table>\n" +
    "=09=09=09=09<![endif]-->\n" +
    "            </td>\n" +
    "        </tr>\n" +
    "    </tbody>\n" +
    "</table><table border=3D\"0\" cellpadding=3D\"0\" cellspacing=3D\"0\" width=3D\"10=\n" +
    "0%\" class=3D\"mcnTextBlock\" style=3D\"min-width: 100%;border-collapse: collap=\n" +
    "se;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-=\n" +
    "webkit-text-size-adjust: 100%;\">\n" +
    "    <tbody class=3D\"mcnTextBlockOuter\">\n" +
    "        <tr>\n" +
    "            <td valign=3D\"top\" class=3D\"mcnTextBlockInner\" style=3D\"padding=\n" +
    "-top: 9px;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-=\n" +
    "text-size-adjust: 100%;\">\n" +
    "              =09<!--[if mso]>\n" +
    "=09=09=09=09<table align=3D\"left\" border=3D\"0\" cellspacing=3D\"0\" cellpaddin=\n" +
    "g=3D\"0\" width=3D\"100%\" style=3D\"width:100%;\">\n" +
    "=09=09=09=09<tr>\n" +
    "=09=09=09=09<![endif]-->\n" +
    "=09=09=09\n" +
    "=09=09=09=09<!--[if mso]>\n" +
    "=09=09=09=09<td valign=3D\"top\" width=3D\"600\" style=3D\"width:600px;\">\n" +
    "=09=09=09=09<![endif]-->\n" +
    "                <table align=3D\"left\" border=3D\"0\" cellpadding=3D\"0\" cellsp=\n" +
    "acing=3D\"0\" style=3D\"max-width: 100%;min-width: 100%;border-collapse: colla=\n" +
    "pse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;=\n" +
    "-webkit-text-size-adjust: 100%;\" width=3D\"100%\" class=3D\"mcnTextContentCont=\n" +
    "ainer\">\n" +
    "                    <tbody><tr>\n" +
    "\n" +
    "                        <td valign=3D\"top\" class=3D\"mcnTextContent\" style=\n" +
    "=3D\"padding-top: 0;padding-right: 18px;padding-bottom: 9px;padding-left: 18=\n" +
    "px;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-si=\n" +
    "ze-adjust: 100%;word-break: break-word;color: #202020;font-family: Helvetic=\n" +
    "a;font-size: 16px;line-height: 150%;text-align: left;\">\n" +
    "\n" +
    "                            You can reply with your thoughts or, \"Done!\" to=\n" +
    " let me know you've reflected.<br>\n" +
    "<br>\n" +
    "Happy Tuesday,<br>\n" +
    "Your friend, Cactus<br>\n" +
    "<br>\n" +
    "<span style=3D\"font-size:Default Size\">Want to share Cactus with a friend? =\n" +
    "Send them&nbsp;<a href=3D\"https://app.us20.list-manage.com/track/click?u=3D=\n" +
    "676af7cc149986aaec398daa7&amp;id=3D6b3867779f&amp;e=3D0bcd131ced\" target=3D=\n" +
    "\"_blank\" style=3D\"mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;=\n" +
    "-webkit-text-size-adjust: 100%;color: #007C89;font-weight: normal;text-deco=\n" +
    "ration: underline;\">this link</a>.</span>\n" +
    "                        </td>\n" +
    "                    </tr>\n" +
    "                </tbody></table>\n" +
    "=09=09=09=09<!--[if mso]>\n" +
    "=09=09=09=09</td>\n" +
    "=09=09=09=09<![endif]-->\n" +
    "\n" +
    "=09=09=09=09<!--[if mso]>\n" +
    "=09=09=09=09</tr>\n" +
    "=09=09=09=09</table>\n" +
    "=09=09=09=09<![endif]-->\n" +
    "            </td>\n" +
    "        </tr>\n" +
    "    </tbody>\n" +
    "</table></td>\n" +
    "                            </tr>\n" +
    "                            <tr>\n" +
    "                                <td valign=3D\"top\" id=3D\"templateFooter\" st=\n" +
    "yle=3D\"mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-tex=\n" +
    "t-size-adjust: 100%;border-top: 0;border-bottom: 0;\"><table border=3D\"0\" ce=\n" +
    "llpadding=3D\"0\" cellspacing=3D\"0\" width=3D\"100%\" class=3D\"mcnTextBlock\" sty=\n" +
    "le=3D\"min-width: 100%;border-collapse: collapse;mso-table-lspace: 0pt;mso-t=\n" +
    "able-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;=\n" +
    "\">\n" +
    "    <tbody class=3D\"mcnTextBlockOuter\">\n" +
    "        <tr>\n" +
    "            <td valign=3D\"top\" class=3D\"mcnTextBlockInner\" style=3D\"padding=\n" +
    "-top: 9px;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-=\n" +
    "text-size-adjust: 100%;\">\n" +
    "              =09<!--[if mso]>\n" +
    "=09=09=09=09<table align=3D\"left\" border=3D\"0\" cellspacing=3D\"0\" cellpaddin=\n" +
    "g=3D\"0\" width=3D\"100%\" style=3D\"width:100%;\">\n" +
    "=09=09=09=09<tr>\n" +
    "=09=09=09=09<![endif]-->\n" +
    "=09=09=09\n" +
    "=09=09=09=09<!--[if mso]>\n" +
    "=09=09=09=09<td valign=3D\"top\" width=3D\"600\" style=3D\"width:600px;\">\n" +
    "=09=09=09=09<![endif]-->\n" +
    "                <table align=3D\"left\" border=3D\"0\" cellpadding=3D\"0\" cellsp=\n" +
    "acing=3D\"0\" style=3D\"max-width: 100%;min-width: 100%;border-collapse: colla=\n" +
    "pse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;=\n" +
    "-webkit-text-size-adjust: 100%;\" width=3D\"100%\" class=3D\"mcnTextContentCont=\n" +
    "ainer\">\n" +
    "                    <tbody><tr>\n" +
    "\n" +
    "                        <td valign=3D\"top\" class=3D\"mcnTextContent\" style=\n" +
    "=3D\"padding-top: 0;padding-right: 18px;padding-bottom: 9px;padding-left: 18=\n" +
    "px;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-si=\n" +
    "ze-adjust: 100%;word-break: break-word;color: #202020;font-family: Helvetic=\n" +
    "a;font-size: 12px;line-height: 150%;text-align: left;\">\n" +
    "\n" +
    "                            <br>\n" +
    "<br>\n" +
    "<span style=3D\"color:#A9A9A9\">Don't want these emails anymore?</span><span =\n" +
    "style=3D\"color:#A9A9A9\">&nbsp;</span><span style=3D\"color:#808080\"><a href=\n" +
    "=3D\"https://app.us20.list-manage.com/unsubscribe?u=3D676af7cc149986aaec398d=\n" +
    "aa7&amp;id=3Dc70b4b8de0&amp;e=3D0bcd131ced&amp;c=3D66d7a69778\" style=3D\"mso=\n" +
    "-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adj=\n" +
    "ust: 100%;color: #202020;font-weight: normal;text-decoration: underline;\">U=\n" +
    "nsubscribe here</a>.</span>\n" +
    "                        </td>\n" +
    "                    </tr>\n" +
    "                </tbody></table>\n" +
    "=09=09=09=09<!--[if mso]>\n" +
    "=09=09=09=09</td>\n" +
    "=09=09=09=09<![endif]-->\n" +
    "\n" +
    "=09=09=09=09<!--[if mso]>\n" +
    "=09=09=09=09</tr>\n" +
    "=09=09=09=09</table>\n" +
    "=09=09=09=09<![endif]-->\n" +
    "            </td>\n" +
    "        </tr>\n" +
    "    </tbody>\n" +
    "</table></td>\n" +
    "                            </tr>\n" +
    "                        </tbody></table>\n" +
    "                        <!--[if (gte mso 9)|(IE)]>\n" +
    "                        </td>\n" +
    "                        </tr>\n" +
    "                        </table>\n" +
    "                        <![endif]-->\n" +
    "                        <!-- // END TEMPLATE -->\n" +
    "                    </td>\n" +
    "                </tr>\n" +
    "            </tbody></table>\n" +
    "        </center>\n" +
    "    <img src=3D\"https://app.us20.list-manage.com/track/open.php?u=3D676af7c=\n" +
    "c149986aaec398daa7&amp;id=3D66d7a69778&amp;e=3D0bcd131ced\" height=3D\"1\" wid=\n" +
    "th=3D\"1\">\n" +
    "</div></blockquote></body></html>\n" +
    "--Apple-Mail-F02ED38B-55BC-472D-83F2-C35D5A59382F--";

