import * as admin from "firebase-admin";
import AdminUserService from "@shared/services/AdminUserService";
import User from "@shared/models/User";
import AdminCactusMemberService from "@shared/services/AdminCactusMemberService";
import {
    AttachmentColor,
    sendActivityNotification,
    SlackAttachment,
    SlackAttachmentField,
    SlackMessage
} from "@api/slack/slack";
import SubscriptionRequest from "@shared/mailchimp/models/SubscriptionRequest";
import {destructureDisplayName} from "@shared/util/StringUtil";
import CactusMember from "@shared/models/CactusMember";
import MailchimpService from "@shared/services/MailchimpService";
import {ListMember, ListMemberStatus} from "@shared/mailchimp/models/MailchimpTypes";
import {SubscriptionResultStatus} from "@shared/mailchimp/models/SubscriptionResult";
import {formatDate} from "@shared/util/DateUtil";


const userService = AdminUserService.getSharedInstance();
const memberService = AdminCactusMemberService.getSharedInstance();
const mailchimpService = MailchimpService.getSharedInstance();

export async function onCreate(user: admin.auth.UserRecord): Promise<void> {
    const email = user.email;
    const userId = user.uid;
    const displayName = user.displayName || "";

    const fields: SlackAttachmentField[] = [];
    let attachmentColor = AttachmentColor.success;
    const attachment: SlackAttachment = {fields, color: attachmentColor};
    const attachments = [attachment];
    const slackMessage: SlackMessage = {attachments: attachments};

    fields.push({
        title: "User ID",
        value: userId,
        short: false,
    });

    fields.push({
        title: "Sign-in Method(s)",
        value: user.providerData.map(p => p.providerId).join(", "),
        short: false
    });


    if (user.email){
        fields.push({
            title: "Email",
            value: user.email,
            short: false,
        })
    }

    if (user.phoneNumber){
        fields.push({
            title: "Phone Number",
            value: user.phoneNumber,
            short: false,
        })
    }

    if (user.displayName){
        fields.push({
            title: "Display Name",
            value: user.displayName,
            short: false,
        })
    }

    if (!email) {
        attachment.text = ":warning: No email found on newly created Admin user " + user.uid;
        // await sendActivityNotification(slackMessage);

    }
    let cactusMember:CactusMember|undefined;
    let mailchimpMember:ListMember|undefined;
    if (email){
        cactusMember = await memberService.getMemberByEmail(email);

        if (!cactusMember) {
            const {firstName, lastName} = destructureDisplayName(displayName);
            const subscription: SubscriptionRequest = new SubscriptionRequest(email);
            subscription.lastName = lastName;
            subscription.firstName = firstName;

            const mailchimpResult = await mailchimpService.addSubscriber(subscription, ListMemberStatus.subscribed);
            if (mailchimpResult.success) {
                mailchimpMember = mailchimpResult.member;

                if (!mailchimpMember && mailchimpResult.status === SubscriptionResultStatus.existing_subscriber){
                    mailchimpMember = await mailchimpService.getMemberByEmail(email);
                }

                fields.push({
                    title: "Existing Cactus Member",
                    value: `Nope, brand new!`,
                    short: false,
                });

                cactusMember = new CactusMember();
                cactusMember.userId = userId;

                cactusMember.email = email;
                cactusMember.lastName = lastName;
                cactusMember.firstName = firstName;
                cactusMember.signupAt = new Date();
                cactusMember.signupConfirmedAt = new Date();

                cactusMember.mailchimpListMember = mailchimpMember;
            }
            else {
                console.error("Failed to create mailchimp subscriber", JSON.stringify(mailchimpResult));
                attachments.push({
                    text: `Failed to save mailchimp list member\n\`\`\`${JSON.stringify(mailchimpResult.error, null, 2)}\`\`\``,
                    color: AttachmentColor.error
                });
            }
        } else {
            fields.push({
                title: "Existing Cactus Member",
                value: `Yes, since ${formatDate(cactusMember.signupAt || cactusMember.createdAt) || 'unknown'}`,
                short: false,
            })
        }
    }


    const model = new User();
    model.createdAt = new Date();
    model.email = user.email;
    model.id = userId;
    model.phoneNumber = user.phoneNumber;

    if (cactusMember) {
        cactusMember.userId = userId;
        cactusMember = await memberService.save(cactusMember);
        mailchimpMember = cactusMember.mailchimpListMember;
        model.cactusMemberId = cactusMember.id;
        fields.push({
            title: "Cactus Member ID",
            value: cactusMember.id || '--',
            short: false,
        })
    }

    if (mailchimpMember) {
        let webId = mailchimpMember.web_id || '--';
        if (mailchimpMember.web_id) {
            webId = `<https://us20.admin.mailchimp.com/lists/members/view?id=${mailchimpMember.web_id}|${mailchimpMember.web_id}>`
        }

        fields.push(
            {
                title: "Mailchimp Status",
                value: `${mailchimpMember.status || 'not sure'}`,
                short: true,
            }, {
                title: "Mailchimp Member Web ID",
                value: webId,
                short: false
            }, {
                title: "Mailchimp Member ID",
                value: mailchimpMember.id || '--',
                short: false
            });
    }


    const savedModel = await userService.save(model);
    attachment.title = `${user.email || user.phoneNumber} has signed up :wave:`;
    console.log("Saved user to db. UserId = ", savedModel.id);
    attachment.ts = `${(new Date()).getTime() / 1000}`;

    await sendActivityNotification(slackMessage);

}

export async function onDelete(user: admin.auth.UserRecord) {
    const deletedUser = await userService.delete(user.uid);
    const attachment: SlackAttachment = {
        text: `:ghost: ${user.email} has been deleted`,
        color: AttachmentColor.warning
    };

    attachment.ts = `${(new Date().getTime() / 1000)}`;

    const fields: SlackAttachmentField[] = [
        {
            title: "User ID",
            value: user.uid,
            short: false,
        },
        {
            title: "Email",
            value: user.email || '--',
            short: false,
        },
    ];

    if (user.phoneNumber){
        fields.push({
            title: "Phone Number",
            value: user.phoneNumber,
            short: false,
        })
    }

    if (user.displayName){
        fields.push({
            title: "Display Name",
            value: user.displayName,
            short: false,
        })
    }

    fields.push({
        title: "Sign-in Method(s)",
        value: user.providerData.map(p => p.providerId).join(", "),
        short: false
    });

    if (deletedUser) {
        let cactusMember: CactusMember | undefined = undefined;
        if (deletedUser.cactusMemberId) {
            cactusMember = await memberService.getById(deletedUser.cactusMemberId);
            await memberService.delete(deletedUser.cactusMemberId);
        }

        fields.push(
            {
                title: "Cactus Member ID",
                value: deletedUser.cactusMemberId || '--',
                short: false,
            });

        let webIdLink: string | undefined;
        if (cactusMember && cactusMember.mailchimpListMember) {
            webIdLink = `<https://us20.admin.mailchimp.com/lists/members/view?id=${cactusMember.mailchimpListMember.web_id}|${cactusMember.mailchimpListMember.web_id}>`
            fields.push({
                title: "Mailchimp Web ID",
                value: webIdLink,
                short: false,
            })
        }

        attachment.fields = fields;
    } else {
        attachment.text = `:ghost: No user found in DB. Deleted them from Auth.`;
    }


    const message: SlackMessage = {attachments: [attachment]};
    await sendActivityNotification(message);


}