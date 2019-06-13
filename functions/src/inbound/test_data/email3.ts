export const headers = {
    "te": "deflate,gzip;q=0.3",
    "connection": "TE, close",
    "host": "224bddcb.ngrok.io",
    "user-agent": "Sendlib/1.0 mx0052p1mdw1.sendgrid.net",
    "content-length": "11909",
    "content-type": "multipart/form-data; boundary=xYzZY",
    "x-forwarded-proto": "https",
    "x-forwarded-for": "167.89.117.41"
};

export const body = `--xYzZY
Content-Disposition: form-data; name="headers"

Received: by mx0052p1mdw1.sendgrid.net with SMTP id Hrur5qErnm Thu, 13 Jun 2019 20:36:08 +0000 (UTC)
Received: from mail-yb1-f175.google.com (mail-yb1-f175.google.com [209.85.219.175]) by mx0052p1mdw1.sendgrid.net (Postfix) with ESMTPS id 9CE9F5C374A for <test@test.myfleck.com>; Thu, 13 Jun 2019 20:36:08 +0000 (UTC)
Received: by mail-yb1-f175.google.com with SMTP id v144so122561ybb.4 for <test@test.myfleck.com>; Thu, 13 Jun 2019 13:36:08 -0700 (PDT)
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=kinecho-com.20150623.gappssmtp.com; s=20150623; h=mime-version:references:in-reply-to:from:date:message-id:subject:to; bh=7BSjs8H5Fzx4sbg8A3374pZ0ekAmmL2EqBzWBJOyvMA=; b=klvsbx3qVtybJr+cUzXauETFBF+d4m+mnM3f8WCKnRkaGjmA29IEAXbl5mMwrWPujD 6Fp8DcobQgCd207Uh8SPwap9hHL20TxcqrV/z/n1sAt5ikLbVskhJJhGVylgJiw1JKbi oQWF7EDnBYblBOe48NOFDFcRccGdE+A0OmXi96Kl1VmlQax6DAqO+t4qE5lrHWHYZqic VgJzmrXqsDBu/GbCW656C5qcJGQRPxPSIq+2KotW8QS1t1zziLQiH/26BJfEviqkB8lN pjoXBiNkX1rrqkkbXga34xs7/zpKvUl5H0Ew/sRAwyOmEawHyT/D7Ehmr4/c3xOKjMjQ eJZg==
X-Google-DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=1e100.net; s=20161025; h=x-gm-message-state:mime-version:references:in-reply-to:from:date :message-id:subject:to; bh=7BSjs8H5Fzx4sbg8A3374pZ0ekAmmL2EqBzWBJOyvMA=; b=lgM93naon4zVmx9uUnUHfscE3pYNPJokGjaeS7dma6rDC2/ZWnQmOiz8UnYlWtrqhP lJjLHajtBDXhNcrNNQPCjz8yQb3MAgC+m/VaJ1Bri11q7yf8la/urvwa0/+GxyjauLj4 3+tgHB9MDIaiAo8P5Vg+5Quw42RnNO/bVjPCfbEKDX3x4+MzpRgDDIGxXdoVMYk9ej1y Jy4blkSQ2v0zffYpLPTucMFsZNent4nAE3fLiridFqrrW9CT0E3dzB+CvBEdNXr7i7yO KBut+eHiOWHzSo8G5ziOkmmbN+R3oBGt4kbPgCstZUgbGjqDdO0oZLy55E/f9D5HDfoT rLzA==
X-Gm-Message-State: APjAAAVAahktjmwDAfv0AXVr/UffsB0Kq9XKVklQAvVHxRc/dBgO+5KP D6wVIEK5MrskLv1C7pPdOm2qIqi8cBeoLHLzLxRzmUlAKlE=
X-Google-Smtp-Source: APXvYqyMQ7mUGhGgX0o+HFlaPNQgxK9D+LgBv0QI0JDZCrCcoOxv5PMUOeWq+MRkP8TemVBgLM6hvKBkjSC00m7z18c=
X-Received: by 2002:a25:26c5:: with SMTP id m188mr47905930ybm.16.1560458167887; Thu, 13 Jun 2019 13:36:07 -0700 (PDT)
MIME-Version: 1.0
References: <676af7cc149986aaec398daa7.b6b0b79489.20190613084410.fc05fe6559.aae61d15@mail94.suw13.rsgsv.net>
In-Reply-To: <676af7cc149986aaec398daa7.b6b0b79489.20190613084410.fc05fe6559.aae61d15@mail94.suw13.rsgsv.net>
From: Neil Poulin <neil@kinecho.com>
Date: Thu, 13 Jun 2019 14:35:57 -0600
Message-ID: <CABT1paJPqEdS8FyjiNix3pkEVAZ0E1UpnQhzm-m6FtBW_-7v6Q@mail.gmail.com>
Subject: Re: When do you feel deep satisfaction?
To: test@test.myfleck.com
Content-Type: multipart/alternative; boundary="xYzZY"

--xYzZY
Content-Disposition: form-data; name="dkim"

{@kinecho-com.20150623.gappssmtp.com : pass}
--xYzZY
Content-Disposition: form-data; name="to"

test@test.myfleck.com
--xYzZY
Content-Disposition: form-data; name="html"

<div dir="ltr">this is my answer</div><br><div class="gmail_quote"><div dir="ltr" class="gmail_attr">On Thu, Jun 13, 2019 at 2:44 AM Cactus &lt;hello@cactus.app&gt; wrote:<br></div><blockquote class="gmail_quote" style="margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex"><u></u>

    
        
        
        
        
        
        

    
    <div style="background:none 50% 50%/cover no-repeat rgb(255,255,255);height:100%;margin:0px;padding:0px;width:100%">
        
        <center>
            <table align="center" border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="gmail-m_-4542431557683367020bodyTable" style="background:none 50% 50%/cover no-repeat rgb(255,255,255);border-collapse:collapse;height:100%;margin:0px;padding:0px;width:100%">
                <tbody><tr>
                    <td align="left" valign="top" id="gmail-m_-4542431557683367020bodyCell" style="height:100%;margin:0px;padding:10px;width:100%;border-top:0px">
                        
                        
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="gmail-m_-4542431557683367020templateContainer" style="border-collapse:collapse;border:0px;max-width:600px">
                            <tbody><tr>
                                <td valign="top" id="gmail-m_-4542431557683367020templateHeader" style="border-top:0px;border-bottom:0px"></td>
                            </tr>
                            <tr>
                                <td valign="top" id="gmail-m_-4542431557683367020templateBody" style="border-top:0px;border-bottom:0px"><table border="0" cellpadding="0" cellspacing="0" width="100%" class="gmail-m_-4542431557683367020mcnTextBlock" style="min-width:100%;border-collapse:collapse">
    <tbody class="gmail-m_-4542431557683367020mcnTextBlockOuter">
        <tr>
            <td valign="top" class="gmail-m_-4542431557683367020mcnTextBlockInner" style="padding-top:9px">
              \t
\t\t\t
\t\t\t\t
                <table align="left" border="0" cellpadding="0" cellspacing="0" style="max-width:100%;min-width:100%;border-collapse:collapse" width="100%" class="gmail-m_-4542431557683367020mcnTextContentContainer">
                    <tbody><tr>

                        <td valign="top" class="gmail-m_-4542431557683367020mcnTextContent" style="padding:0px 18px 9px;word-break:break-word;color:rgb(32,32,32);font-family:Helvetica;font-size:16px;line-height:150%;text-align:left">
<span style="white-space:pre-wrap">Hi Neil,</span>
                        </td>
                    </tr>
                </tbody></table>
\t\t\t\t

\t\t\t\t
            </td>
        </tr>
    </tbody>
</table><table border="0" cellpadding="0" cellspacing="0" width="100%" class="gmail-m_-4542431557683367020mcnTextBlock" style="min-width:100%;border-collapse:collapse">
    <tbody class="gmail-m_-4542431557683367020mcnTextBlockOuter">
        <tr>
            <td valign="top" class="gmail-m_-4542431557683367020mcnTextBlockInner" style="padding-top:9px">
              \t
\t\t\t
\t\t\t\t
                <table align="left" border="0" cellpadding="0" cellspacing="0" style="max-width:100%;min-width:100%;border-collapse:collapse" width="100%" class="gmail-m_-4542431557683367020mcnTextContentContainer">
                    <tbody><tr>

                        <td valign="top" class="gmail-m_-4542431557683367020mcnTextContent" style="padding:0px 18px 9px;word-break:break-word;color:rgb(32,32,32);font-family:Helvetica;font-size:16px;line-height:150%;text-align:left">

                            <span><u><strong>Today’s Question</strong></u><br>
When do you feel deep satisfaction?</span><br>
<br>
<a href="https://app.us20.list-manage.com/track/click?u=676af7cc149986aaec398daa7&amp;id=8f96c56d20&amp;e=b6b0b79489" style="color:rgb(0,124,137);font-weight:normal;text-decoration:underline" target="_blank"><span>Go deeper on this reflection →</span></a><br>
 
                        </td>
                    </tr>
                </tbody></table>
\t\t\t\t

\t\t\t\t
            </td>
        </tr>
    </tbody>
</table><table border="0" cellpadding="0" cellspacing="0" width="100%" class="gmail-m_-4542431557683367020mcnTextBlock" style="min-width:100%;border-collapse:collapse">
    <tbody class="gmail-m_-4542431557683367020mcnTextBlockOuter">
        <tr>
            <td valign="top" class="gmail-m_-4542431557683367020mcnTextBlockInner" style="padding-top:9px">
              \t
\t\t\t
\t\t\t\t
                <table align="left" border="0" cellpadding="0" cellspacing="0" style="max-width:100%;min-width:100%;border-collapse:collapse" width="100%" class="gmail-m_-4542431557683367020mcnTextContentContainer">
                    <tbody><tr>

                        <td valign="top" class="gmail-m_-4542431557683367020mcnTextContent" style="padding:0px 18px 9px;word-break:break-word;color:rgb(32,32,32);font-family:Helvetica;font-size:16px;line-height:150%;text-align:left">

                            You can reply with your thoughts or, &quot;Done!&quot; to let me know you&#39;ve reflected.<br>
<br>
Happy Thursday,<br>
Your friend, Cactus<br>
<br>
<span>Want to share Cactus with a friend? Send them <a href="https://app.us20.list-manage.com/track/click?u=676af7cc149986aaec398daa7&amp;id=68421a044c&amp;e=b6b0b79489" style="color:rgb(0,124,137);font-weight:normal;text-decoration:underline" target="_blank">this link</a>.</span>
                        </td>
                    </tr>
                </tbody></table>
\t\t\t\t

\t\t\t\t
            </td>
        </tr>
    </tbody>
</table></td>
                            </tr>
                            <tr>
                                <td valign="top" id="gmail-m_-4542431557683367020templateFooter" style="border-top:0px;border-bottom:0px"><table border="0" cellpadding="0" cellspacing="0" width="100%" class="gmail-m_-4542431557683367020mcnTextBlock" style="min-width:100%;border-collapse:collapse">
    <tbody class="gmail-m_-4542431557683367020mcnTextBlockOuter">
        <tr>
            <td valign="top" class="gmail-m_-4542431557683367020mcnTextBlockInner" style="padding-top:9px">
              \t
\t\t\t
\t\t\t\t
                <table align="left" border="0" cellpadding="0" cellspacing="0" style="max-width:100%;min-width:100%;border-collapse:collapse" width="100%" class="gmail-m_-4542431557683367020mcnTextContentContainer">
                    <tbody><tr>

                        <td valign="top" class="gmail-m_-4542431557683367020mcnTextContent" style="padding:0px 18px 9px;word-break:break-word;color:rgb(32,32,32);font-family:Helvetica;font-size:12px;line-height:150%;text-align:left">

                            <br>
<br>
<span style="color:rgb(169,169,169)">Don&#39;t want these emails anymore?</span><span style="color:rgb(169,169,169)"> </span><span style="color:rgb(128,128,128)"><a href="https://app.us20.list-manage.com/unsubscribe?u=676af7cc149986aaec398daa7&amp;id=c70b4b8de0&amp;e=b6b0b79489&amp;c=fc05fe6559" style="color:rgb(32,32,32);font-weight:normal;text-decoration:underline" target="_blank">Unsubscribe here</a>.</span>
                        </td>
                    </tr>
                </tbody></table>
\t\t\t\t

\t\t\t\t
            </td>
        </tr>
    </tbody>
</table></td>
                            </tr>
                        </tbody></table>
                        
                        
                    </td>
                </tr>
            </tbody></table>
        </center>
    <img src="https://app.us20.list-manage.com/track/open.php?u=676af7cc149986aaec398daa7&amp;id=fc05fe6559&amp;e=b6b0b79489" height="1" width="1"></div>
</blockquote></div>

--xYzZY
Content-Disposition: form-data; name="from"

Neil Poulin <neil@kinecho.com>
--xYzZY
Content-Disposition: form-data; name="text"

this is my answer

On Thu, Jun 13, 2019 at 2:44 AM Cactus <hello@cactus.app> wrote:

> Hi Neil,
> *Today’s Question*
> When do you feel deep satisfaction?
>
> Go deeper on this reflection →
> <https://app.us20.list-manage.com/track/click?u=676af7cc149986aaec398daa7&id=8f96c56d20&e=b6b0b79489>
>
> You can reply with your thoughts or, "Done!" to let me know you've
> reflected.
>
> Happy Thursday,
> Your friend, Cactus
>
> Want to share Cactus with a friend? Send them this link
> <https://app.us20.list-manage.com/track/click?u=676af7cc149986aaec398daa7&id=68421a044c&e=b6b0b79489>
> .
>
>
> Don't want these emails anymore? Unsubscribe here
> <https://app.us20.list-manage.com/unsubscribe?u=676af7cc149986aaec398daa7&id=c70b4b8de0&e=b6b0b79489&c=fc05fe6559>
> .
>

--xYzZY
Content-Disposition: form-data; name="sender_ip"

209.85.219.175
--xYzZY
Content-Disposition: form-data; name="envelope"

{"to":["test@test.myfleck.com"],"from":"neil@kinecho.com"}
--xYzZY
Content-Disposition: form-data; name="attachments"

0
--xYzZY
Content-Disposition: form-data; name="subject"

Re: When do you feel deep satisfaction?
--xYzZY
Content-Disposition: form-data; name="charsets"

{"to":"UTF-8","html":"UTF-8","subject":"UTF-8","from":"UTF-8","text":"UTF-8"}
--xYzZY
Content-Disposition: form-data; name="SPF"

permerror
--xYzZY--

`.split("\n").join("\r\n")


export const firebaseHeaders = {
    "host": "us-central1-cactus-app-stage.cloudfunctions.net",
    "user-agent": "Sendlib/1.0 mx0020p1mdw1.sendgrid.net",
    "transfer-encoding": "chunked",
    "content-type": "multipart/form-data; boundary=xYzZY",
    "forwarded": "for=\"167.89.117.85\";proto=https",
    "function-execution-id": "1lrgvqoe8h33",
    "x-appengine-city": "?",
    "x-appengine-citylatlong": "0.000000,0.000000",
    "x-appengine-country": "US",
    "x-appengine-default-version-hostname": "zea02c0ff7f416118-tp.appspot.com",
    "x-appengine-https": "on",
    "x-appengine-region": "?",
    "x-appengine-request-log-id": "5d02cf6a00ff04bcc509414b330001737e7a656130326330666637663431363131382d7470000137616565396336393366303662633135336437623064323834343461376132303a3239000100",
    "x-appengine-user-ip": "167.89.117.85",
    "x-cloud-trace-context": "a60a027697e3e34ae87eed9d098c1cf3/9320667304137486355;o=1",
    "x-forwarded-for": "167.89.117.85",
    "x-forwarded-proto": "https",
    "accept-encoding": "gzip",
    "connection": "close"
};
export const firebaseBody = `--xYzZY
Content-Disposition: form-data; name="headers"

Received: by mx0020p1mdw1.sendgrid.net with SMTP id rQOs7LbMY2 Thu, 13 Jun 2019 22:34:16 +0000 (UTC)
Received: from mail-yw1-f44.google.com (mail-yw1-f44.google.com [209.85.161.44]) by mx0020p1mdw1.sendgrid.net (Postfix) with ESMTPS id 22448A072FB for <hello@inboundstage.cactus.app>; Thu, 13 Jun 2019 22:34:16 +0000 (UTC)
Received: by mail-yw1-f44.google.com with SMTP id s5so227767ywd.9 for <hello@inboundstage.cactus.app>; Thu, 13 Jun 2019 15:34:16 -0700 (PDT)
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=kinecho-com.20150623.gappssmtp.com; s=20150623; h=mime-version:from:date:message-id:subject:to; bh=HMUjG/R+yHafNAXHHA+SBUgjOvl18KnQoBv2JwYlOaA=; b=ot/qiXZSVptivgickpz7ajVn4rStnZI+arN0iQF0qDKSw7jnSUMM6D5PKqUF5rvPQg R+sM4Lk3NHDiJo+z5df92FuUw8AyTO8Hx0OIckDrT66uPVVDJRkn9FXgV657B76gHKk4 ozai4sWX6HPB+/0TV2DcNSPisK4U/bACRxe8ZQf3MkyHiwO+eXG2S/rN3U9VLE+xjwYN +hy8uhPEnYnUjJTXsUXgupis+Yrfr1IHRIgHe0O16kcfZwtCb0ev/f2AroU5JE7nqTlH xD0UVD4ut1UHpLnH0Yna5dXcrAxk5kFkiF9M360sFNDvO8MU6xGUtLtIUyzZ3MdU+biz jKFg==
X-Google-DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=1e100.net; s=20161025; h=x-gm-message-state:mime-version:from:date:message-id:subject:to; bh=HMUjG/R+yHafNAXHHA+SBUgjOvl18KnQoBv2JwYlOaA=; b=PYodtRBMTNF431Nh8PgEyRFmwR6pJ5LZ9l+Z69HxFal4gRW26rgtOq1bt3GRkLtQbf aOVJXEV0ZKDA+gyegrPgxe9os1H0xJtLECnc2u9te0qtB6ju+YXMbfekwthgFtZADRZc 2jx9D0a/pZ8x6QRbVsLRg6Pi9olHqPrLgmmt6f7DO38vuVJZ0WDb/ZMWnVO0JGv3eaga T36UjKJ4vnHOPfgeRXu2Cnt1FPdNvKL5xuItscCUqtlKSB1/D0ej4POWIfwf4we2lfSo CI+T4hdJgQVVGduwIxKYZFAB6I+9JtdAcGljFVKna5iiSys3YZFI0PI5OKcCCBAQ9jhc LjNQ==
X-Gm-Message-State: APjAAAUNy6erkSr4tm2QKhJE4rDwusq56V7R0tWuwmaZlQnPkjUDH3RH poCccrcdPJH00m0nYGDNBiZkYYnAGqWQWbBDrhuNyk6pEgVb6g==
X-Google-Smtp-Source: APXvYqxpeaoOkChrD09N0kDmyx44LPpfyL+TA2jE7Z28jbjJ87AAC2yn9Cn7Ra7Jk3nB3Bf9xHFDtlVauzcfj2MvWn8=
X-Received: by 2002:a81:5e0a:: with SMTP id s10mr10460190ywb.369.1560465255324; Thu, 13 Jun 2019 15:34:15 -0700 (PDT)
MIME-Version: 1.0
From: Neil Poulin <neil@kinecho.com>
Date: Thu, 13 Jun 2019 16:34:04 -0600
Message-ID: <CABT1paK7AT9G-r4OT5d2=XOT54jjp_3NHHR2xNOHTDwh9ngL9g@mail.gmail.com>
Subject: hello
To: hello@inboundstage.cactus.app
Content-Type: multipart/alternative; boundary="0000000000003a72f4058b3c214f"

--xYzZY
Content-Disposition: form-data; name="attachments"

0
--xYzZY
Content-Disposition: form-data; name="dkim"

{@kinecho-com.20150623.gappssmtp.com : pass}
--xYzZY
Content-Disposition: form-data; name="subject"

hello
--xYzZY
Content-Disposition: form-data; name="to"

hello@inboundstage.cactus.app
--xYzZY
Content-Disposition: form-data; name="html"

<div dir="ltr">hi</div>

--xYzZY
Content-Disposition: form-data; name="text"

hi

--xYzZY
Content-Disposition: form-data; name="from"

Neil Poulin <neil@kinecho.com>
--xYzZY
Content-Disposition: form-data; name="sender_ip"

209.85.161.44
--xYzZY
Content-Disposition: form-data; name="envelope"

{"to":["hello@inboundstage.cactus.app"],"from":"neil@kinecho.com"}
--xYzZY
Content-Disposition: form-data; name="charsets"

{"to":"UTF-8","html":"UTF-8","subject":"UTF-8","from":"UTF-8","text":"UTF-8"}
--xYzZY
Content-Disposition: form-data; name="SPF"

permerror
--xYzZY--`.split("\n").join("\r\n");


export const busboyBody = ['-----------------------------paZqsnEHRufoShdX6fh0lUhXBP4k',
    'Content-Disposition: form-data; name="text"',
    '',
    'super alpha file',
    '-----------------------------paZqsnEHRufoShdX6fh0lUhXBP4k',
    'Content-Disposition: form-data; name="subject"',
    '',
    'super beta file',
    '-----------------------------paZqsnEHRufoShdX6fh0lUhXBP4k--'
].join('\r\n');

export const busboyHeaders = {
    "host": "us-central1-cactus-app-stage.cloudfunctions.net",
    "user-agent": "Sendlib/1.0 mx0020p1mdw1.sendgrid.net",
    "transfer-encoding": "chunked",
    "content-type": "multipart/form-data; boundary=---------------------------paZqsnEHRufoShdX6fh0lUhXBP4k",
    "forwarded": "for=\"167.89.117.85\";proto=https",
    "function-execution-id": "1lrgvqoe8h33",
    "x-appengine-city": "?",
    "x-appengine-citylatlong": "0.000000,0.000000",
    "x-appengine-country": "US",
    "x-appengine-default-version-hostname": "zea02c0ff7f416118-tp.appspot.com",
    "x-appengine-https": "on",
    "x-appengine-region": "?",
    "x-appengine-request-log-id": "5d02cf6a00ff04bcc509414b330001737e7a656130326330666637663431363131382d7470000137616565396336393366303662633135336437623064323834343461376132303a3239000100",
    "x-appengine-user-ip": "167.89.117.85",
    "x-cloud-trace-context": "a60a027697e3e34ae87eed9d098c1cf3/9320667304137486355;o=1",
    "x-forwarded-for": "167.89.117.85",
    "x-forwarded-proto": "https",
    "accept-encoding": "gzip",
    "connection": "close"
};