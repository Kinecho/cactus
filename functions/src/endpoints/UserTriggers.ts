import * as admin from "firebase-admin";
import AdminUserService from "@shared/services/AdminUserService";
import User from "@shared/models/User";
import AdminCactusMemberService from "@shared/services/AdminCactusMemberService";
import {sendActivityNotification} from "@api/slack/slack";
// import MailchimpService from "@shared/services/MailchimpService";
import SubscriptionRequest from "@shared/mailchimp/models/SubscriptionRequest";
import {destructureDisplayName} from "@shared/util/StringUtil";
// import CactusMember from "@shared/models/CactusMember";
// import {ListMemberStatus} from "@shared/mailchimp/models/ListMember";

const userService = AdminUserService.getSharedInstance();
const memberService = AdminCactusMemberService.getSharedInstance();
// const mailchimpService = MailchimpService.getSharedInstance();

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

        //TODO: add back in subscription
        await sendActivityNotification("New user signed up - need to add them to mailchimp list");

        // const mailchimpResult = await mailchimpService.addSubscriber(subscription, ListMemberStatus.subscribed);
        // if (mailchimpResult.success){
        //     const mailchimpMember = mailchimpResult.member;
        //     cactusMember = new CactusMember();
        //     cactusMember.userId = userId;
        //     cactusMember.mailchimpListMember = mailchimpMember;
        //     cactusMember.email = email;
        //     cactusMember.lastName = lastName;
        //     cactusMember.firstName = firstName;
        //     cactusMember.signupAt = new Date();
        //     cactusMember.signupConfirmedAt = new Date();
        // }
        // else {
        //     console.error("Failed to create mailchimp subscriber", JSON.stringify(mailchimpResult));
        // }
    }

    if (cactusMember){
        cactusMember.userId = userId;
        cactusMember = await memberService.save(cactusMember);

        model.cactusMemberId = cactusMember.id;
    }


    const savedModel = await userService.save(model);
    console.log("Saved user to db. UserId = ", savedModel.id);

}

export function onDelete(user:admin.auth.UserRecord){

}