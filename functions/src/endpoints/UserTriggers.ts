import * as admin from "firebase-admin";
import AdminUserService from "@admin/services/AdminUserService";
import User from "@shared/models/User";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import SubscriptionRequest from "@shared/mailchimp/models/SubscriptionRequest";
import {destructureDisplayName, getProviderDisplayName} from "@shared/util/StringUtil";
import CactusMember from "@shared/models/CactusMember";
import MailchimpService from "@admin/services/MailchimpService";
import {ListMember, ListMemberStatus} from "@shared/mailchimp/models/MailchimpTypes";
import {SubscriptionResultStatus} from "@shared/mailchimp/models/SubscriptionResult";
import {formatDate} from "@shared/util/DateUtil";
import AdminSlackService, {
    AttachmentColor,
    SlackAttachment,
    SlackAttachmentField,
    SlackMessage
} from "@admin/services/AdminSlackService";
import AdminPendingUserService from "@admin/services/AdminPendingUserService";
import PendingUser from "@shared/models/PendingUser";
import AdminSentPromptService from "@admin/services/AdminSentPromptService";


const userService = AdminUserService.getSharedInstance();
const memberService = AdminCactusMemberService.getSharedInstance();
const mailchimpService = MailchimpService.getSharedInstance();
const slackService = AdminSlackService.getSharedInstance();

export async function onCreate(user: admin.auth.UserRecord): Promise<void> {
    const email = user.email;
    const userId = user.uid;
    const displayName = user.displayName || "";
    const errorAttachments: SlackAttachment[] = [];

    if (!email) {
        await AdminSlackService.getSharedInstance().sendActivityMessage({
            text: "Unable to complete registration",
            attachments: [{
                text: ":warning: No email found on newly created Admin user " + user.uid + `\n\`\`\`${JSON.stringify(user.toJSON())}\`\`\``,
                color: AttachmentColor.error
            }]
        });
        console.error("No email found on the new auth.User", JSON.stringify(user.toJSON(), null, 2));
        return;
    }

    const pendingUser = await AdminPendingUserService.getSharedInstance().completeSignup({email, userId});
    console.log("Fetched pending user", JSON.stringify(pendingUser, null, 2));

    const {member: cactusMember, existingCactusMember, errorAttachments: cactusMemberErrors} = await initializeCactusMember({
        email,
        displayName,
        pendingUser,
        user,
    });
    errorAttachments.push(...cactusMemberErrors);

    const userModel = new User();
    userModel.createdAt = new Date();
    userModel.email = user.email;
    userModel.id = userId;
    userModel.phoneNumber = user.phoneNumber;
    userModel.providerIds = user.providerData.map(provider => provider.providerId);
    userModel.cactusMemberId = cactusMember.id;

    const savedUser = await userService.save(userModel);
    console.log("Saved user to db. UserId = ", savedUser.id);

    await AdminSentPromptService.getSharedInstance().initializeSentPromptsFromPendingUser({
        pendingUser,
        user: savedUser,
        member: cactusMember
    });

    const slackMessage = createSlackMessage({
        member: cactusMember,
        user,
        pendingUser,
        existingCactusMember,
        errorAttachments
    });

    await slackService.sendActivityNotification(slackMessage);

}

async function initializeCactusMember(options: { email: string, displayName?: string, pendingUser?: PendingUser, user: admin.auth.UserRecord }): Promise<{ member: CactusMember, existingCactusMember: boolean, errorAttachments: SlackAttachment[] }> {
    const {email, displayName, pendingUser, user} = options;
    const {firstName, lastName} = destructureDisplayName(displayName);
    const errorAttachments: SlackAttachment[] = [];
    console.log("Setting up cactus member");
    let cactusMember = await memberService.getMemberByEmail(email);
    const existingCactusMember = !!cactusMember;
    if (!cactusMember) {
        cactusMember = new CactusMember();
        cactusMember.userId = user.uid;
        cactusMember.email = email;
        cactusMember.lastName = lastName;
        cactusMember.firstName = firstName;
        cactusMember.signupAt = new Date();
        cactusMember.signupConfirmedAt = new Date();
        cactusMember.signupQueryParams = pendingUser ? pendingUser.queryParams : {};
        cactusMember.referredByEmail = pendingUser && pendingUser.referredByEmail;

        const subscription: SubscriptionRequest = new SubscriptionRequest(email);
        subscription.lastName = lastName;
        subscription.firstName = firstName;
        subscription.referredByEmail = cactusMember.referredByEmail;
        const {mailchimpListMember, error: mailchimpError} = await upsertMailchimpSubscriber(subscription);

        cactusMember.mailchimpListMember = mailchimpListMember;

        if (mailchimpError) {
            errorAttachments.push({
                text: `Failed to save mailchimp list member\n\`\`\`${JSON.stringify(mailchimpError, null, 2)}\`\`\``,
                color: AttachmentColor.error
            });
        }
    } else {
        cactusMember.userId = user.uid;
        try {
            await MailchimpService.getSharedInstance().updateMemberStatus({
                email: email,
                status: ListMemberStatus.subscribed
            });
        } catch (e) {
            console.error("failed to updated subscriber status", e);
            errorAttachments.push({
                text: `:warning: Unable to set mailchimp subscriber status to Subscribed during the User Created trigger for email ${email}\`\`\``,
                color: AttachmentColor.error
            });
        }
    }

    const savedMember = await AdminCactusMemberService.getSharedInstance().save(cactusMember);


    return {member: savedMember, errorAttachments, existingCactusMember};

}


async function upsertMailchimpSubscriber(subscription: SubscriptionRequest): Promise<{ mailchimpListMember?: ListMember, error?: any }> {
    const mailchimpResult = await mailchimpService.addSubscriber(subscription, ListMemberStatus.subscribed);
    if (mailchimpResult.success) {
        let mailchimpMember = mailchimpResult.member;

        if (!mailchimpMember && mailchimpResult.status === SubscriptionResultStatus.existing_subscriber) {
            mailchimpMember = await mailchimpService.getMemberByEmail(subscription.email);
        }


        // mailchimpListMember = mailchimpMember;
        return {mailchimpListMember: mailchimpMember};
    } else {
        console.error("Failed to create mailchimp subscriber", JSON.stringify(mailchimpResult));//
        return {error: mailchimpResult.error || {message: `Failed to subscribe ${subscription.email} to mailchimp.`}};
    }
}

function createSlackMessage(args: { member?: CactusMember, user: admin.auth.UserRecord, pendingUser?: PendingUser, existingCactusMember: boolean, errorAttachments: SlackAttachment[] }): SlackMessage {
    const {member, user, existingCactusMember, errorAttachments, pendingUser} = args;

    const fields: SlackAttachmentField[] = [];
    const attachment: SlackAttachment = {fields, color: AttachmentColor.success};
    const attachments = [attachment, ...errorAttachments];
    attachment.title = `:wave: ${user.email || user.phoneNumber} has signed up `;

    const slackMessage: SlackMessage = {};
    if (!member) {
        attachments.push({title: `No member was found or created. UserId = ${user.uid}`, color: "danger"});
        return slackMessage;
    }


    if (member.getReferredBy()) {
        fields.push({
            title: "Referred By",
            value: member.getReferredBy() || "--"
        })
    }

    if (member.getSignupMedium() || member.getSignupMedium()) {
        fields.push({
            title: "Source / Medium",
            value: `${member.getSignupSource() || "--"} / ${member.getSignupMedium() || "--"}`
        })
    }

    fields.push({
        title: "Sign-in Method(s)",
        value: user.providerData.map(p => `${AdminSlackService.getProviderEmoji(p.providerId)} ${getProviderDisplayName(p.providerId)}`.trim()).join("\n"),
        short: false
    });

    if (existingCactusMember) {
        fields.push({
            title: "Existing Cactus Member",
            value: `Since ${formatDate(member.signupAt || member.createdAt) || 'unknown'}`,
            short: false,
        })
    }

    if (pendingUser && pendingUser.reflectionResponseIds.length > 0) {
        fields.push({
            title: "Anonymous Reflections Transferred",
            value: `${pendingUser.reflectionResponseIds.length}`
        })
    }

    slackMessage.attachments = attachments;
    attachment.ts = `${(new Date()).getTime() / 1000}`;
    return slackMessage;
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

    if (user.phoneNumber) {
        fields.push({
            title: "Phone Number",
            value: user.phoneNumber,
            short: false,
        })
    }

    if (user.displayName) {
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
            webIdLink = `<https://us20.admin.mailchimp.com/lists/members/view?id=${cactusMember.mailchimpListMember.web_id}|${cactusMember.mailchimpListMember.web_id}>`;
            fields.push({
                title: "Mailchimp Web ID",
                value: webIdLink,
                short: false,
            })
        }
    } else {
        attachment.text = `:ghost: No user found in DB. Deleted them from Auth.`;
    }
    attachment.fields = fields;

    const message: SlackMessage = {attachments: [attachment]};
    await slackService.sendActivityNotification(message);


}