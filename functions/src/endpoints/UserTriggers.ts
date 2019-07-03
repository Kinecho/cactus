import * as admin from "firebase-admin";
import AdminUserService from "@shared/services/AdminUserService";
import User from "@shared/models/User";
import AdminCactusMemberService from "@shared/services/AdminCactusMemberService";
import {sendActivityNotification} from "@api/slack/slack";
import SubscriptionRequest from "@shared/mailchimp/models/SubscriptionRequest";
import {destructureDisplayName} from "@shared/util/StringUtil";
import CactusMember from "@shared/models/CactusMember";
import MailchimpService from "@shared/services/MailchimpService";
import {ListMemberStatus} from "@shared/mailchimp/models/MailchimpTypes";


const userService = AdminUserService.getSharedInstance();
const memberService = AdminCactusMemberService.getSharedInstance();
const mailchimpService = MailchimpService.getSharedInstance();

export async function onCreate(user:admin.auth.UserRecord):Promise<void>{
    const email = user.email;
    const userId = user.uid;
    const displayName = user.displayName || "";

    if (!email){
        await sendActivityNotification(":rotating_light: No user found on newly created Admin user " + user.uid);
        return;
    }

    const model = new User();
    model.createdAt = new Date();
    model.email = user.email;
    model.id = userId;

    let cactusMember = await memberService.getMemberByEmail(email);

    if (!cactusMember){
        const {firstName, lastName} = destructureDisplayName(displayName);
        const subscription:SubscriptionRequest = new SubscriptionRequest(email);
        subscription.lastName = lastName;
        subscription.firstName = firstName;

        await sendActivityNotification(`:wave: ${user.email} has signed up`);

        const mailchimpResult = await mailchimpService.addSubscriber(subscription, ListMemberStatus.subscribed);
        if (mailchimpResult.success){
            await sendActivityNotification(`Successfully signed ${email} up to mailchimp with status ${mailchimpResult.member}`);
            const mailchimpMember = mailchimpResult.member ? mailchimpResult.member.toFirestoreData() : undefined;
            cactusMember = new CactusMember();
            cactusMember.userId = userId;
            cactusMember.mailchimpListMember = mailchimpMember;
            cactusMember.email = email;
            cactusMember.lastName = lastName;
            cactusMember.firstName = firstName;
            cactusMember.signupAt = new Date();
            cactusMember.signupConfirmedAt = new Date();
        }
        else {
            console.error("Failed to create mailchimp subscriber", JSON.stringify(mailchimpResult));
            await sendActivityNotification(`Failed to create mailchimp subscriber for ${user.email}.\n\`\`\`${JSON.stringify(mailchimpResult.error)}\`\`\``);
        }
    }

    if (cactusMember){
        cactusMember.userId = userId;
        cactusMember = await memberService.save(cactusMember);

        model.cactusMemberId = cactusMember.id;
        await sendActivityNotification(`Successfully saved ${user.email} to the db \nUserId=${userId}.\nMailchimpMemberId=${cactusMember.mailchimpListMember ? cactusMember.mailchimpListMember.id : 'unknown'}`);
    }


    const savedModel = await userService.save(model);
    console.log("Saved user to db. UserId = ", savedModel.id);

}

export async function onDelete(user:admin.auth.UserRecord){
    await sendActivityNotification(`:ghost: ${user.email} has been delete`)

}