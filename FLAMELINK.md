# Introduction
Below is a copy of the email that was sent to introduce flamelink to the team. This might be useful in the future for anyone looking to understand the thought process of choosing the Flamelink CMS.


Useful Links:
- [Flamelink CMS](https://flamelink.io)
- [Pull Request Adding Flamelink to Cactus.app](https://github.com/Kinecho/cactus/pull/32)


Hi everyone, 

# TLDR;
When you get a password reset email for Cactus, please follow the instructions at the end of this email. 
If your password reset link is no longer valid, let me know and I’ll generate a new one for you.

As you know, we will soon have a content management system to help us create our sweet sweet daily prompts. The system that I’ve selected is called Flamelink. First, some highlights and potential challenges with this choice. Then, I’ll provide instructions on how we’ll all get access and start using this system. 

# 🔥Hotness of Flamelink🔥
Integrates directly into Firebase/Firestore (our existing database)
We 100% own the data - it lives in our own database, not some third party’s
We can access the data via their SDKs use the standard Firebase SDKs, since it’s just firestore data. This is important because we aren’t locked into a vendor solution.
Data can be used across all devices types, Web, iOS, Android, or API
We can all have access to a visual way to edit our content
Images can be uploaded and managed directly in the interface - no jumping around
We will serve images via Cloudinary, so we can have access to dynamic resizing and other manipulations on-the-fly
Images are hosted in our Cloud Storage bucket, so we have full ownership
Fairly granular user-level permissions… so I can make sure Ryan can’t edit the schema 🤣 😂
Concept of environments so we can “snap” or sync data from production to stage, or vice versa. 
Low price - $34/month for all 4 of us to have access. $9/month per additional user. 
Webhooks - allows us to respond to actions taken in the CMS and perform actions like scheduling emails
Simple - the interface is pretty simple and straightforward. There aren’t really any complicated workflows or concepts we need to learn about
Extremely flexible data model - I get to determine how everything is set up. Just about anything is possible
The company is run by a small startup, so they have been very responsive to my requests. They also have a community slack group that is decently active.

Now for some of the downsides/challenges that I anticipate we’ll face

# 🥶Not so cool things🥶
The company is pretty new (a year or so?), so there are some gaps in feature/functionality. (I mostly worked through the obvious ones for our current plans before deciding to go this direction, but I’m sure others will pop up.)
You never know how long they’ll be in business, but to point 1 above, we own all the data and can access it on our own if needed (vs their SDKs).
The interface has a few obvious bugs (I’ve reported what I’ve seen so far)
I’m hoping they’ll get fixed fast since it’s a startup…
Nothing deal-breaking, and I’ve found little workarounds 
It seems that our model is already testing some of the limits of what Flamelink was designed to do
For the large lists of content items that we’ll have, the interface can be a bit clunky
The user authentication to get started is pretty confusing and hard to use (see my instructions below to deal with this)
Their Firestore SDK (read: client code on npm) is in an Alpha (or maybe it’s even pre-release Alpha)
It seems to work just fine for our basic needs right now, and it’s open source, so we could always fork it if something major happens. 
This is mostly a maintenance consideration - if things change in upcoming releases, I’ll have to deal with it. That’s fine. 
The data syncing doesn’t work exactly how I’d want - but I have a plan to manage the limitations with process on our side

Great, you read all that. Now for information on getting logged into this thing. 

# How to get access to this thing
You will receive a Password Reset email from Cactus sometime soon. Please click the link and generate a strong password. (Use your best judgement on what a strong password is. It only is used to protect our production data…). The purpose of this is actually to create a password for your account because using the Magic Link flow means you don’t have one yet. Flamelink uses the normal Firebase Authentication system and requires you to use a password.
You will get an email from Flamelink telling you that you’ve been invited to the CMS. Please do this after creating your password in step 1. Click the link in the email to accept the invite.
You’ll probably get hit with a signup page. Sign in with Google with your Kinecho email (I know, you just made a password, but trust me).
At this point, you should see a list of projects that you’re in. If you don’t see this, please let me know and we’ll work it out.
Ok, this is where it gets really weird, but we should be in good shape. Click the “Log In” button for Cactus-App-Prod. You should see a modal that says something to the effect of “enter first time password”. 
In this modal, enter the password you created via the password reset flow in step 1.
Voila, you should now be in the CMS! Actual training on the product will occur sometime next week. 