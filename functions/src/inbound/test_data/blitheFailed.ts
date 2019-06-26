export default `Delivered-To: hello@cactus.app
Received: by 2002:a0c:a8c9:0:0:0:0:0 with SMTP id h9csp151919qvc;
        Tue, 25 Jun 2019 18:32:45 -0700 (PDT)
X-Received: by 2002:a5d:8508:: with SMTP id q8mr1983305ion.31.1561512765132;
        Tue, 25 Jun 2019 18:32:45 -0700 (PDT)
ARC-Seal: i=1; a=rsa-sha256; t=1561512765; cv=none;
        d=google.com; s=arc-20160816;
        b=SZjMQUq2+7wqprBWA1Nh+RkrrQaik0LGgEFkuHpRYhGFWk4G8hSJVQjT54FcldRy/C
         2/2rvy10Vlkbs9RfLWblRp7ZHno92r6SQ/3XnKwzJ7Id0QAfRp0T/0dNbyZ9fomMkzVN
         EckbupTZa+7ln7VpC+md8AlzF5ksXVAsJ3weEi8pAF57VtcUmHgM/7u9ITVMz1ehk8lt
         XjLy5ovul+PZCKP/pHRLURcpUW7WL8eki0jUzanZKcnbq39EGAZf+gMmvPOSt3s+9KPx
         +DGRGzNH+l9KBIIrcSD52itGOFVt+/5zvk0PJCeXeMv6rRBqdUS9pln/jTjGUdRyxzMH
         1uww==
ARC-Message-Signature: i=1; a=rsa-sha256; c=relaxed/relaxed; d=google.com; s=arc-20160816;
        h=to:in-reply-to:references:message-id:subject:date:mime-version
         :content-transfer-encoding:from:dkim-signature;
        bh=ZZg4f9C01njsNXeQslL77bcagRrxFYE1g4tAku1/Gnk=;
        b=VOXkG2xWbrs/NYdst2XdbXY/WUXXWx/lTTRylUPJukb2G0hqMq2Se9opQMDQprKPjj
         sUv6Low0mt/Kfa37AfMRxAcju5vbf+hoRAGF3hA+R/bjVPEb2FMG5JMrIssWPlpRTbbS
         3qNIB8a7NUANjihT2TIwXW3EeIFhIHtwjOrhVrrmwkWO1fIqXvEcWdn0PMHmo5d36PI2
         yEmSOwtHsxftDrmBnU2MA1NNuBq1kYDW1X4JwWV0um4nKJFv5nWXouL/fLLrGN9aWxWL
         Bbpw5HuoRixskqJfWuEQxuaN+r8testLm2i66I0HVKKrZUEHZ4IXn2ypsG3AHBfIE9d0
         4ZsQ==
ARC-Authentication-Results: i=1; mx.google.com;
       dkim=pass header.i=@gmail.com header.s=20161025 header.b=sVaBvAjB;
       spf=pass (google.com: domain of blitherocher@gmail.com designates 209.85.220.41 as permitted sender) smtp.mailfrom=blitherocher@gmail.com;
       dmarc=pass (p=NONE sp=QUARANTINE dis=NONE) header.from=gmail.com
Return-Path: <blitherocher@gmail.com>
Received: from mail-sor-f41.google.com (mail-sor-f41.google.com. [209.85.220.41])
        by mx.google.com with SMTPS id 131sor39706321jac.14.2019.06.25.18.32.44
        for <hello@cactus.app>
        (Google Transport Security);
        Tue, 25 Jun 2019 18:32:45 -0700 (PDT)
Received-SPF: pass (google.com: domain of blitherocher@gmail.com designates 209.85.220.41 as permitted sender) client-ip=209.85.220.41;
Authentication-Results: mx.google.com;
       dkim=pass header.i=@gmail.com header.s=20161025 header.b=sVaBvAjB;
       spf=pass (google.com: domain of blitherocher@gmail.com designates 209.85.220.41 as permitted sender) smtp.mailfrom=blitherocher@gmail.com;
       dmarc=pass (p=NONE sp=QUARANTINE dis=NONE) header.from=gmail.com
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;
        d=gmail.com; s=20161025;
        h=from:content-transfer-encoding:mime-version:date:subject:message-id
         :references:in-reply-to:to;
        bh=ZZg4f9C01njsNXeQslL77bcagRrxFYE1g4tAku1/Gnk=;
        b=sVaBvAjBc8YZLQX4W3Ja8X25dw8vpnW5kuERZbdLPWXoWQBXN2HC5UZOPvj/1K7b/T
         Oy/HVQ1/8LtBqj/MQcLal8mZwKWJr/3+zRjjo4Lu7jhF96lFmtUns81CV7hTqqlQgrro
         343j28D7hmJ/HzzqWVFuMK8yzWzDjtXnVX2ppXozk9ax5lXaf1iIjr3NK39w4q6tnBO6
         RPVYAV7VG/xtBd/KdI20HRsUqqxOLEvvHWbhJTNZlCLknMvBrMBG04eYLNX19awzuimK
         ljdS78cGZ2yNz/NZRVFk2qKNKLd0ZRhTIzbfTB5otDZyaYaC3W/8sl+PNkFEcVnFqd2r
         XM2A==
X-Google-DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;
        d=1e100.net; s=20161025;
        h=x-gm-message-state:from:content-transfer-encoding:mime-version:date
         :subject:message-id:references:in-reply-to:to;
        bh=ZZg4f9C01njsNXeQslL77bcagRrxFYE1g4tAku1/Gnk=;
        b=OiNvhOSCsGwi10NS1CoXttzV+68idQQI0C1IIceudfsSig0hGXsHHuUG91MFvpJVTp
         v/GcXOZnmaXmvRJNgSWGdQcDkavaJCTMufR2puTlJ/EHQMvPB+Im6ds9B+pew88A7pua
         fUsKqJWTuH54s17U3NtUkGRjk25FklAr+FSFKtfvSRqgkW0BxO/4QYoaORSnnPraF072
         +bJ5zHa0y/R0eRPQ+oJy7N99uls7ITWNXDEHQGmKZ3bgUTIgHUyesopZpeipq3/4LChd
         3RcG9ga6+iHGYPx4a6vFXz476LhAIERR4tRqgWBIkw5/c4VGcE9G9QDCxBY9bYoJd3/f
         6Kmg==
X-Gm-Message-State: APjAAAVREOGn4fEmuISWQua12RDjLrGGH/l0ZPYDiih3qI4l7cAsK1nl JrPLLQ8JqIIbP+BvKannflnFUVOY
X-Google-Smtp-Source: APXvYqwFjdVaTzFKxc04XFUObxqMINRumQLk3J9V+XyA6QZ3DFlD197HkD6xo6DRj27Yyq0LO6sdVw==
X-Received: by 2002:a02:7420:: with SMTP id o32mr1584316jac.117.1561512764437;
        Tue, 25 Jun 2019 18:32:44 -0700 (PDT)
Return-Path: <blitherocher@gmail.com>
Received: from [192.168.1.71] (99-155-38-179.lightspeed.sntcca.sbcglobal.net. [99.155.38.179])
        by smtp.gmail.com with ESMTPSA id l2sm12280162ioh.20.2019.06.25.18.32.43
        for <hello@cactus.app>
        (version=TLS1_2 cipher=ECDHE-RSA-AES128-GCM-SHA256 bits=128/128);
        Tue, 25 Jun 2019 18:32:44 -0700 (PDT)
From: Blithe Rocher <blitherocher@gmail.com>
Content-Type: text/plain; charset=us-ascii
Content-Transfer-Encoding: quoted-printable
Mime-Version: 1.0 (1.0)
Date: Tue, 25 Jun 2019 18:32:43 -0700
Subject: Re: What film, television series, or work of theater allows you to think and feel in new ways?
Message-Id: <92C1E8C7-FB53-4C75-98DB-3EB16EBCC4F2@gmail.com>
References: <676af7cc149986aaec398daa7.9662285379.20190625084408.d21e7d4a46.858449e9@mail254.atl61.mcsv.net>
In-Reply-To: <676af7cc149986aaec398daa7.9662285379.20190625084408.d21e7d4a46.858449e9@mail254.atl61.mcsv.net>
To: Cactus <hello@cactus.app>
X-Mailer: iPhone Mail (16F203)

Done=20

Sent from my iPhone

On Jun 25, 2019, at 1:44 AM, Cactus <hello@cactus.app> wrote:

What film, television series, or work of theater allows you to think and fe=
el in new ways?`