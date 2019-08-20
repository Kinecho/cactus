import * as admin from "firebase-admin";
import AdminUserService from "@admin/services/AdminUserService";
import User from "@shared/models/User";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import SubscriptionRequest from "@shared/mailchimp/models/SubscriptionRequest";
import {destructureDisplayName} from "@shared/util/StringUtil";
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
import AdminReflectionResponseService from "@admin/services/AdminReflectionResponseService";


const userService = AdminUserService.getSharedInstance();
const memberService = AdminCactusMemberService.getSharedInstance();
const mailchimpService = MailchimpService.getSharedInstance();
const slackService = AdminSlackService.getSharedInstance();

export async function onCreate(user: admin.auth.UserRecord): Promise<void> {
    const email = user.email;
    const userId = user.uid;
    const displayName = user.displayName || "";
    const fields: SlackAttachmentField[] = [];
    const attachment: SlackAttachment = {fields, color: AttachmentColor.success};
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


    if (user.email) {
        fields.push({
            title: "Email",
            value: user.email,
            short: false,
        })
    }

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

    let pendingUser: PendingUser | undefined;
    if (!email) {
        attachment.text = ":warning: No email found on newly created Admin user " + user.uid;
        // await sendActivityNotification(slackMessage);
    } else {
        pendingUser = await AdminPendingUserService.getSharedInstance().completeSignup({email, userId});
        console.log("Fetched pending user", JSON.stringify(pendingUser, null, 2));
    }

    let cactusMember: CactusMember | undefined;
    let mailchimpMember: ListMember | undefined;

    if (email) {
        cactusMember = await memberService.getMemberByEmail(email);

        if (!cactusMember) {
            const {firstName, lastName} = destructureDisplayName(displayName);
            const subscription: SubscriptionRequest = new SubscriptionRequest(email);
            subscription.lastName = lastName;
            subscription.firstName = firstName;
            subscription.referredByEmail = pendingUser ? pendingUser.referredByEmail : undefined;

            const mailchimpResult = await mailchimpService.addSubscriber(subscription, ListMemberStatus.subscribed);
            if (mailchimpResult.success) {
                mailchimpMember = mailchimpResult.member;

                if (!mailchimpMember && mailchimpResult.status === SubscriptionResultStatus.existing_subscriber) {
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
            } else {
                console.error("Failed to create mailchimp subscriber", JSON.stringify(mailchimpResult));
                attachments.push({
                    text: `Failed to save mailchimp list member\n\`\`\`${JSON.stringify(mailchimpResult.error, null, 2)}\`\`\``,
                    color: AttachmentColor.error
                });
            }
        } else {
            try {
                await MailchimpService.getSharedInstance().updateMemberStatus({
                    email: email,
                    status: ListMemberStatus.subscribed
                });
            } catch (e) {
                console.error("failed to updated subscriber status", e);
                await AdminSlackService.getSharedInstance().sendActivityMessage({text: `:warning: Unable to set mailchimp subscriber status to Subscribed during the User Created trigger for email ${email}\`\`\``})
            }

            fields.push({
                title: "Existing Cactus Member",
                value: `Yes, since ${formatDate(cactusMember.signupAt || cactusMember.createdAt) || 'unknown'}`,
                short: false,
            })
        }
    }


    const userModel = new User();
    userModel.createdAt = new Date();
    userModel.email = user.email;
    userModel.id = userId;
    userModel.phoneNumber = user.phoneNumber;
    userModel.providerIds = user.providerData.map(provider => provider.providerId);
    if (cactusMember) {
        cactusMember.userId = userId;

        let referredByEmail = cactusMember.referredByEmail || (cactusMember.mailchimpListMember ? cactusMember.mailchimpListMember.merge_fields.REF_EMAIL as string : undefined);
        if (!referredByEmail && pendingUser && pendingUser.referredByEmail) {
            referredByEmail = pendingUser.referredByEmail;
            if (email) {
                console.log("Updating mailchimp referred by email merge field to ", referredByEmail);
                await MailchimpService.getSharedInstance().updateMergeFields({
                    email: email,
                    mergeFields: {REF_EMAIL: pendingUser.referredByEmail}
                })
            }
        }
        cactusMember.referredByEmail = referredByEmail;

        mailchimpMember = cactusMember.mailchimpListMember;
        cactusMember = await memberService.save(cactusMember);
        userModel.cactusMemberId = cactusMember.id;
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
                title: "Mailchimp Web ID",
                value: webId,
                short: false
            })
    }

    if (cactusMember && cactusMember.referredByEmail) {
        fields.push({
            title: "Referred By",
            value: cactusMember.referredByEmail || "--"
        })
    }


    const savedModel = await userService.save(userModel);


    if (pendingUser && cactusMember) {
        await setupPendingUser({pendingUser, user: savedModel, member: cactusMember});
    }

    attachment.title = `:wave: ${user.email || user.phoneNumber} has signed up `;
    console.log("Saved user to db. UserId = ", savedModel.id);
    attachment.ts = `${(new Date()).getTime() / 1000}`;

    await slackService.sendActivityNotification(slackMessage);

}

async function setupPendingUser(options: { pendingUser: PendingUser, member: CactusMember, user: User }): Promise<void> {
    const {member, user, pendingUser} = options;
    console.log(`setting up pending user for email ${member.email}`);
    let tasks: Promise<any>[] = [];
    if (pendingUser.reflectionResponseIds) {
        pendingUser.reflectionResponseIds.forEach(id => {
            tasks.push(new Promise(async resolve => {
                const reflectionResponse = await AdminReflectionResponseService.getSharedInstance().getById(id);
                if (reflectionResponse) {
                    console.log(`Updating anonymous reflection response to have member info ${id} - ${member.email}`);
                    reflectionResponse.anonymous = false;
                    reflectionResponse.cactusMemberId = member.id;
                    reflectionResponse.memberEmail = member.email;
                    reflectionResponse.mailchimpMemberId = member.mailchimpListMember && member.mailchimpListMember.id;
                    reflectionResponse.mailchimpUniqueEmailId = member.mailchimpListMember && member.mailchimpListMember.unique_email_id;
                    reflectionResponse.userId = user.id;
                    await AdminReflectionResponseService.getSharedInstance().save(reflectionResponse);
                }
                resolve();
                return;
            }));

        })
    }

    await Promise.all(tasks);


    return;
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

        attachment.fields = fields;
    } else {
        attachment.text = `:ghost: No user found in DB. Deleted them from Auth.`;
    }


    const message: SlackMessage = {attachments: [attachment]};
    await slackService.sendActivityNotification(message);


}