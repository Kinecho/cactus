export const headers = {
    "host": "us-central1-cactus-app-prod.cloudfunctions.net",
    "user-agent": "Sendlib/1.0 mx0045p1mdw1.sendgrid.net",
    "transfer-encoding": "chunked",
    "content-type": "multipart/form-data; boundary=xYzZY",
    "forwarded": "for=\"167.89.117.42\";proto=https",
    "function-execution-id": "im6887fdwhpm",
    "x-appengine-city": "?",
    "x-appengine-citylatlong": "0.000000,0.000000",
    "x-appengine-country": "US",
    "x-appengine-default-version-hostname": "qb5440b525d886c5f-tp.appspot.com",
    "x-appengine-https": "on",
    "x-appengine-region": "?",
    "x-appengine-request-log-id": "5d38c20700ff034eb576d83ef50001737e71623534343062353235643838366335662d7470000137616565396336393366303662633135336437623064323834343461376132303a3431000100",
    "x-appengine-user-ip": "167.89.117.42",
    "x-cloud-trace-context": "49b3a81d62954cb5bbfce2b40deef6da/11824635650615243193;o=1",
    "x-forwarded-for": "167.89.117.42",
    "x-forwarded-proto": "https",
    "accept-encoding": "gzip",
    "connection": "close"
};


export const body = `--xYzZY
Content-Disposition: form-data; name="headers"

Received: by mx0045p1mdw1.sendgrid.net with SMTP id EWhBuktaVT Wed, 24 Jul 2019 20:39:34 +0000 (UTC)
Received: from mail-qt1-f177.google.com (mail-qt1-f177.google.com [209.85.160.177]) by mx0045p1mdw1.sendgrid.net (Postfix) with ESMTPS id 5F217A060BD for <forwarded@inbound.cactus.app>; Wed, 24 Jul 2019 20:39:34 +0000 (UTC)
Received: by mail-qt1-f177.google.com with SMTP id d23so46921169qto.2 for <forwarded@inbound.cactus.app>; Wed, 24 Jul 2019 13:39:34 -0700 (PDT)
X-Google-DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=1e100.net; s=20161025; h=x-gm-message-state:delivered-to:dkim-signature:mime-version :references:in-reply-to:from:date:message-id:subject:to; bh=dAjBWXEn8jcNYDAxsqmjgi2ab0PmKVRfK5y88Hw6LGk=; b=tLwBbEto388BFgFMPYzVVvgQgGPWsVY0GOR1/8hMNN+RE+t98XyFpQyAU6oXVruDAS Dv/bUCiV6bdr4R2ZlOcDKdMiwTAKQWZ7hCxhrZWF8AYu7+Il4rfAY3RlDbQ7lKwMEkbM nOkRaG2+Wyv9KvpA2sAttDRDQ60Ymy6E6x/PkiLT2VSzcwO04mD43G0SQb35TrJrTh2A 9WtfoPw2R3o8ASIVPUjr7P3gevvT26DLxUk96lEY3WZUrfm+2Sc3kZ01gsiUWzijFHwy xf7IKhwRiw50Rpfs6pGtm4C7Woc2CaXdp2RaoSVa+M6Bae9Gp2Z57jLTLnfXbrOFJBQs HEBA==
X-Gm-Message-State: APjAAAVYmIcmbVcIiz0yJZHYtGP3oAhnm+5M7KJaPcE3molil0jaKgl/ KpxnAT+1DO+AUEsZYNb+GuAPi/BMMwSq2FIBFQehQr7dvDt9xT0=
X-Received: by 2002:a0c:b88e:: with SMTP id y14mr58360122qvf.93.1564000773715; Wed, 24 Jul 2019 13:39:33 -0700 (PDT)
X-Forwarded-To: forwarded@inbound.cactus.app
X-Forwarded-For: hello@kinecho.com forwarded@inbound.cactus.app
Delivered-To: hello+p_p6ir5hbc7nlezszv66da@cactus.app
Received: by 2002:a0c:a8c9:0:0:0:0:0 with SMTP id h9csp10249513qvc; Wed, 24 Jul 2019 13:39:32 -0700 (PDT)
X-Received: by 2002:a1c:b146:: with SMTP id a67mr73970395wmf.124.1564000772040; Wed, 24 Jul 2019 13:39:32 -0700 (PDT)
ARC-Seal: i=1; a=rsa-sha256; t=1564000772; cv=none; d=google.com; s=arc-20160816; b=s4QMJCyKvLjaLrQTZmcCyKCS7JqgvypCEj/U2zSlYX1SfE/s1bjgyg5gPgO8zoxw/y fMs36vxNSRFw5i4IsIQ7H2+KsWxmXYDEdpuafw/by5EROLNEK8JbYCBW1ajFDgCS7Yx1 /286fQ0ilF3s1KY49GLKRyCw20nqm4L0JqdNplGPRPHMYe/Mcf2aMUfKlZCubo5XUEIh eUenCW/bwW7tIfLgT/yXJvg+z5eAlbBGrxN+vO0Nb+s1ycG0v7xfioSyzPuJYDuaw1iy mVnH8sLAslrdM2vr6VJjkdvS8dkhvo+H64CQt8EnnMiyxzD4qq9kOmwU7YIPVFxznmc1 UkIg==
ARC-Message-Signature: i=1; a=rsa-sha256; c=relaxed/relaxed; d=google.com; s=arc-20160816; h=to:subject:message-id:date:from:in-reply-to:references:mime-version :dkim-signature; bh=dAjBWXEn8jcNYDAxsqmjgi2ab0PmKVRfK5y88Hw6LGk=; b=xNKx2WML4By/UliXZO7DRQ1wZKIjzR7xknUziGfXEDZS5d+8Oacb75e4XzxNCaZqKE DIQ+IaZaxP5rwoGnf+QP95VrNUIsRjIx7Uigsc5HIueCpozFsCpZHpTioLdyWKfIpX1K UaNEAxiG3ZDibkK0K8H4sSvcvrvdltfZVjJ1HKhStnnZeORLZhQWf3nmbbguT2b/iaLk +LYL3pJQUSjkhV52cCKv5Xxc6IpdePtBuHUyUjGzaHVzs8FZGyDWvlZstzYDjuwmOdQ+ vRGXXtJ1CahZAtFSBZahX2otxDUYlIftFMj3MWi03wr8oEKZanreYI0059dTiiaeXoN7 KdkQ==
ARC-Authentication-Results: i=1; mx.google.com; dkim=pass header.i=@NEILPOULIN-com.20150623.gappssmtp.com header.s=20150623 header.b=07xL4Tu2; spf=softfail (google.com: domain of transitioning neil@neilpoulin.com does not designate 209.85.220.41 as permitted sender) smtp.mailfrom=neil@neilpoulin.com
Received: from mail-sor-f41.google.com (mail-sor-f41.google.com. [209.85.220.41]) by mx.google.com with SMTPS id m6sor37625896wrx.35.2019.07.24.13.39.31 for <hello+p_P6iR5hBc7nLezSZV66dA@cactus.app> (Google Transport Security); Wed, 24 Jul 2019 13:39:31 -0700 (PDT)
Received-SPF: softfail (google.com: domain of transitioning neil@neilpoulin.com does not designate 209.85.220.41 as permitted sender) client-ip=209.85.220.41;
Authentication-Results: mx.google.com; dkim=pass header.i=@NEILPOULIN-com.20150623.gappssmtp.com header.s=20150623 header.b=07xL4Tu2; spf=softfail (google.com: domain of transitioning neil@neilpoulin.com does not designate 209.85.220.41 as permitted sender) smtp.mailfrom=neil@neilpoulin.com
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=NEILPOULIN-com.20150623.gappssmtp.com; s=20150623; h=mime-version:references:in-reply-to:from:date:message-id:subject:to; bh=dAjBWXEn8jcNYDAxsqmjgi2ab0PmKVRfK5y88Hw6LGk=; b=07xL4Tu2nZVWIZ3dakvosBBYXl0s5cxZWf/5HqBniArNS+2FWDwvxZ2RNeYZk/+lae 3aXq3gr53KMZ/K/rO4PHjj8ctQarqrSVfku85HwpMtQRdAeyo8YuTTlocWLReiAytOuT yi4tgx3hKPjiQrEpu1FDHsr2onhKS0OO0AmsERGgMzpYHL8lNYEsgj2WT+c2CAxFeitM oj402vHUBZrLqNW7+/H7A/imtz8IMFMNyFuZ5PQ1K1v1aF8BY582n+u/NL1LywfYNxjj aVVK3W3oOuLMsdHKNz4csN9iHCJKf3uH1oL9/HcY9PInqdaR5cclFHvDsKuCVMZcjmi+ heew==
X-Google-Smtp-Source: APXvYqwSi4lmtdzQ+/MtjqU7qUBu0p1VG5I5hKt19pzzh5sQ0IoMssu7+wuYhcp4CW/VnXceTdyqJ6PKEXYEPXa2GI8=
X-Received: by 2002:adf:ef49:: with SMTP id c9mr13894284wrp.188.1564000771136; Wed, 24 Jul 2019 13:39:31 -0700 (PDT)
MIME-Version: 1.0
References: <676af7cc149986aaec398daa7.7bac31bb62.20190724084408.5de277e6c5.f28033a2@mail17.atl31.mcdlv.net>
In-Reply-To: <676af7cc149986aaec398daa7.7bac31bb62.20190724084408.5de277e6c5.f28033a2@mail17.atl31.mcdlv.net>
From: Neil Poulin <neil@neilpoulin.com>
Date: Wed, 24 Jul 2019 13:39:20 -0700
Message-ID: <CAP6dnmQxSkFBp9Rcyf0L6jW0h459JLzEjzEPx51_xyGdTG+KKA@mail.gmail.com>
Subject: Re: Play gives you a chance
To: Cactus <hello+p_P6iR5hBc7nLezSZV66dA@cactus.app>
Content-Type: multipart/alternative; boundary="000000000000647610058e734ec5"

--xYzZY
Content-Disposition: form-data; name="dkim"

{@NEILPOULIN-com.20150623.gappssmtp.com : pass}
--xYzZY
Content-Disposition: form-data; name="to"

Cactus <hello+p_P6iR5hBc7nLezSZV66dA@cactus.app>
--xYzZY
Content-Disposition: form-data; name="html"

<div dir="ltr"><div class="gmail_default" style="font-family:georgia,serif">Getting weird and feel free of judgement. I love collaborating on strange concepts that spiral into something that is so far away from where we originally started. <br></div></div><br><div class="gmail_quote"><div dir="ltr" class="gmail_attr">On Wed, Jul 24, 2019 at 1:44 AM Cactus &lt;hello+p_P6iR5hBc7nLezSZV66dA@cactus.app&gt; wrote:<br></div><blockquote class="gmail_quote" style="margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex"><u></u>

  
    
    
    
    
    
    

  
  <div style="height:100%;margin:0px;padding:0px;width:100%;font-family:Lato,Helvetica,sans-serif;background:rgb(255,242,237) url(&quot;https://gallery.mailchimp.com/676af7cc149986aaec398daa7/images/c70d398c-776c-40eb-8691-0fa4798ed369.png&quot;) no-repeat scroll 0% 0%/181px auto">
    <center>
      <table id="gmail-m_-2832558983089413834bodyTable" style="height:100%;border-collapse:collapse;margin:0px;padding:0px;width:100%;font-family:Lato,Helvetica,sans-serif;background:rgb(255,242,237) url(&quot;https://gallery.mailchimp.com/676af7cc149986aaec398daa7/images/c70d398c-776c-40eb-8691-0fa4798ed369.png&quot;) no-repeat scroll 0% 0%/181px auto" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
        <tbody><tr>
          <td id="gmail-m_-2832558983089413834bodyCell" style="height:100%;margin:0px;padding:9px;width:100%;font-family:Lato,Helvetica,sans-serif" valign="top" align="center">
            <img style="margin: 20px; border: 0px none; height: auto; outline: currentcolor none medium; text-decoration: none;" src="https://gallery.mailchimp.com/676af7cc149986aaec398daa7/images/f8b71028-4641-4cea-8e4b-fb90eab47b1a.png" alt="logo.svg" width="100">
            <br>
            
            
            <table class="gmail-m_-2832558983089413834templateContainer" style="border-collapse:collapse;max-width:600px" width="100%" cellspacing="0" cellpadding="0" border="0">
              
              <tbody><tr>
                <td id="gmail-m_-2832558983089413834templateBody" style="background:rgb(255,255,255) none no-repeat scroll center center/cover;padding-right:18px;padding-left:18px" valign="top">
                  
                  <div>
                    <p id="gmail-m_-2832558983089413834inspiration" style="margin:1em 0px;padding:0px">Everyone says to follow your passions. Easy, right?<br>
<br>
No way. What does that even mean? TV personality Mr. Rogers said, “Play gives children a chance to practice what they are learning.” Play gives everyone, children and adults, a chance to practice what they’re learning. When you give yourself permission to practice what you’re learning through play, you open yourself to developing your passions.<br>
<br>
Today you’ll find more opportunities to play by identifying those who invite you and encourage you to play. Celebrate them by thanking them, either silently or by forwarding them your thoughts.</p>
                    <div style="display:block;padding:30px 0px">
                      Today&#39;s Question:
                      <br><span id="gmail-m_-2832558983089413834question" style="display:inline-block;font-size:1.25em;font-weight:bold;color:rgb(7,69,76);padding:0px 0px 10px">Who brings out your playful side?</span>
                    <br><span id="gmail-m_-2832558983089413834content_link">
                    <a style="display:inline-block;background-color:rgb(51,204,171);text-decoration:none;color:rgb(255,255,255);padding:15px 30px;border-radius:3rem;margin:0px 0px 20px;font-family:Lato,sans-serif" href="https://app.us20.list-manage.com/track/click?u=676af7cc149986aaec398daa7&amp;id=c9b45ac67a&amp;e=7bac31bb62" target="_blank">Reflect in Cactus Journal</a>
                  </span>
                  <div style="padding:15px 0px 0px"> </div>
                  <span>For your convenience, you can reply to this email with your thoughts and they&#39;ll instantly appear in your Cactus Journal.</span>
                  <p style="margin:1em 0px;padding:0px">
                  Happy Wednesday, <br>
                  Your friend, Cactus
                </p>
                <p style="margin:1em 0px;padding:0px">
                Want to share Cactus with a friend? Send them <a href="https://app.us20.list-manage.com/track/click?u=676af7cc149986aaec398daa7&amp;id=ecff5c9c82&amp;e=7bac31bb62" target="_blank">this link</a>.
              </p>
              <span></span>

            </div>
            
          </div></td>
        </tr>
        
        
        <tr>
          <td id="gmail-m_-2832558983089413834templateFooter" style="padding-right:18px;padding-left:18px" valign="top">
            
            <table style="border-collapse:collapse" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tbody><tr>
                <td id="gmail-m_-2832558983089413834utilityBar" valign="top">
                  <div>Don&#39;t want these emails anymore? <a class="gmail-m_-2832558983089413834utilityLink" href="https://app.us20.list-manage.com/unsubscribe?u=676af7cc149986aaec398daa7&amp;id=c70b4b8de0&amp;e=7bac31bb62&amp;c=5de277e6c5" target="_blank">Unsubscribe here</a><span class="gmail-m_-2832558983089413834mobileHide"> or </span><a class="gmail-m_-2832558983089413834utilityLink" href="https://app.us20.list-manage.com/profile?u=676af7cc149986aaec398daa7&amp;id=c70b4b8de0&amp;e=7bac31bb62" target="_blank">update subscription preferences</a>
                </div>
              </td>
            </tr>
          </tbody></table>
          
        </td>
      </tr>
      
    </tbody></table>
    
    
  </td>
</tr>
</tbody></table>
</center>
<img src="https://app.us20.list-manage.com/track/open.php?u=676af7cc149986aaec398daa7&amp;id=5de277e6c5&amp;e=7bac31bb62" width="1" height="1"></div>
</blockquote></div><br clear="all"><br>-- <br><div dir="ltr" class="gmail_signature"><div dir="ltr"><div><div dir="ltr">







<p><span><b><font color="#cc0000">NEILPOULIN</font></b></span><span>  </span><span>|</span><span>  </span><span><b>Neil Poulin</b></span><span>  </span><span>|</span><span>  Sr. Product Designer  </span><span>|</span><span>  </span><span><b>OFFICE:</b></span><span> 206‑838‑0303 </span></p></div></div></div></div>

--xYzZY
Content-Disposition: form-data; name="from"

Neil Poulin <neil@neilpoulin.com>
--xYzZY
Content-Disposition: form-data; name="text"

Getting weird and feel free of judgement. I love collaborating on strange
concepts that spiral into something that is so far away from where we
originally started.

On Wed, Jul 24, 2019 at 1:44 AM Cactus
<hello+p_P6iR5hBc7nLezSZV66dA@cactus.app> wrote:

> [image: logo.svg]
>
> Everyone says to follow your passions. Easy, right?
>
> No way. What does that even mean? TV personality Mr. Rogers said, “Play
> gives children a chance to practice what they are learning.” Play gives
> everyone, children and adults, a chance to practice what they’re learning.
> When you give yourself permission to practice what you’re learning through
> play, you open yourself to developing your passions.
>
> Today you’ll find more opportunities to play by identifying those who
> invite you and encourage you to play. Celebrate them by thanking them,
> either silently or by forwarding them your thoughts.
> Today's Question:
> Who brings out your playful side?
> Reflect in Cactus Journal
> <https://app.us20.list-manage.com/track/click?u=676af7cc149986aaec398daa7&id=c9b45ac67a&e=7bac31bb62>
>
> For your convenience, you can reply to this email with your thoughts and
> they'll instantly appear in your Cactus Journal.
>
> Happy Wednesday,
> Your friend, Cactus
>
> Want to share Cactus with a friend? Send them this link
> <https://app.us20.list-manage.com/track/click?u=676af7cc149986aaec398daa7&id=ecff5c9c82&e=7bac31bb62>.
>
> Don't want these emails anymore? Unsubscribe here
> <https://app.us20.list-manage.com/unsubscribe?u=676af7cc149986aaec398daa7&id=c70b4b8de0&e=7bac31bb62&c=5de277e6c5>
> or update subscription preferences
> <https://app.us20.list-manage.com/profile?u=676af7cc149986aaec398daa7&id=c70b4b8de0&e=7bac31bb62>
>


-- 

*NEILPOULIN*  |  *Neil Poulin*  |  Sr. Product Designer  |  *OFFICE:*
 206‑838‑0303

--xYzZY
Content-Disposition: form-data; name="sender_ip"

209.85.160.177
--xYzZY
Content-Disposition: form-data; name="envelope"

{"to":["forwarded@inbound.cactus.app"],"from":"hello+caf_=forwarded=inbound.cactus.app@kinecho.com"}
--xYzZY
Content-Disposition: form-data; name="attachments"

0
--xYzZY
Content-Disposition: form-data; name="subject"

Re: Play gives you a chance
--xYzZY
Content-Disposition: form-data; name="charsets"

{"to":"UTF-8","html":"UTF-8","subject":"UTF-8","from":"UTF-8","text":"UTF-8"}
--xYzZY
Content-Disposition: form-data; name="SPF"

permerror
--xYzZY--
`.split("\n").join("\r\n");