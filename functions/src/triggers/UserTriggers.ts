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
import AdminFirestoreService, {Transaction} from "@admin/services/AdminFirestoreService";


const userService = AdminUserService.getSharedInstance();
const memberService = AdminCactusMemberService.getSharedInstance();
const mailchimpService = MailchimpService.getSharedInstance();
const slackService = AdminSlackService.getSharedInstance();

interface UserCheckResult {
    isNewUser?: boolean,
    isNewMember?: boolean,
    error?: string,
    mailchimpError?: any,
    member?: CactusMember | undefined,
    user?: User | undefined,
    pendingUser?: PendingUser | undefined,
    subscriptionToCreate?: SubscriptionRequest
}

/**
 * Using a transaction, create or update the User and CactusMember objects
 * @param {admin.auth.UserRecord} userRecord
 * @return {Promise<UserCheckResult>}
 */
async function setupUserTransaction(userRecord: admin.auth.UserRecord): Promise<UserCheckResult> {
    const userId = userRecord.uid;
    const email = userRecord.email;

    console.log(`Starting signup process for ${email} userId = ${userId}`);
    try {
        /*
        Note: All read actions must happen first. Then the writes.
         */
        return await AdminFirestoreService.getSharedInstance().firestore.runTransaction(async transaction => {
            console.log(`Transaction beginning for ${email} userId = ${userId}`);
            const user = await AdminUserService.getSharedInstance().getById(userId, {transaction});
            const member = await AdminCactusMemberService.getSharedInstance().findCactusMember({
                userId,
                email: userRecord.email
            }, {transaction});

            const result: UserCheckResult = {
                isNewUser: !user,
                isNewMember: !member,
                user,
                member,
            };

            //if the member and user already exist, there's nothing left to do.
            if (!result.isNewUser && !result.isNewMember) {
                return result;
            }

            //if there is no email, we can't continue.
            if (!email) {
                result.error = "No email found on the User Record. Can not set up member";
                return result;
            }

            console.log("Looking for pending user....");
            const pendingUser = await AdminPendingUserService.getSharedInstance().getPendingByEmail(email, {transaction});

            /*
                END OF THE DB READs SECTION.
                Next up, write to the DB.
             */

            console.log(`Pending User for email = ${email}`, pendingUser);
            if (pendingUser) {
                console.log(`Completing pending user signup for ${email}, ${userId}....`);
                result.pendingUser = await AdminPendingUserService.getSharedInstance().completeSignupForPendingUser({
                    pendingUser,
                    userId
                }, {transaction});
                console.log("Pending user signup completed", result.pendingUser);
            }

            console.log("\ncreating cactus member....");
            const createMemberResult = await createCactusMember({user: userRecord, pendingUser, transaction, email});
            console.log(`Cactus Member created ${email}, userId = ${userId}, memberId = ${member && member.id}`, createMemberResult);

            result.member = createMemberResult.member;
            result.mailchimpError = createMemberResult.mailchimpError;

            console.log("Creating the cactus user....");
            const createUserResult = await createCactusUser({
                user: userRecord,
                member: createMemberResult.member,
                transaction
            });
            console.log(`Cactus User created ${email}, userId = ${userId}`, createUserResult);

            result.user = createUserResult.user;

            console.log(`Transaction returning ${email}, ${userId}...`, result);
            return result
        });
    } catch (error) {
        console.error("Failed to complete signup", error);
        return {
            error: `Failed to complete signup transaction.`
        }
    }
}

async function createCactusUser(options: { user: admin.auth.UserRecord, member: CactusMember, transaction: Transaction }): Promise<{ user: User }> {
    const {user, member, transaction} = options;

    const userModel = new User();
    userModel.createdAt = new Date();
    userModel.email = user.email;
    userModel.id = user.uid;
    userModel.phoneNumber = user.phoneNumber;
    userModel.providerIds = user.providerData.map(provider => provider.providerId);
    userModel.cactusMemberId = member.id;

    const savedUser = await AdminUserService.getSharedInstance().save(userModel, {transaction});

    return {user: savedUser}
}


interface CreateMemberOptions {
    user: admin.auth.UserRecord,
    email: string,
    pendingUser?: PendingUser | undefined,
    transaction: Transaction
}

/**
 * Set up and save a new Cactus member using a transaction
 * @param {CreateMemberOptions} options
 * @return {Promise<{member: CactusMember; subscription: SubscriptionRequest}>}
 */
async function createCactusMember(options: CreateMemberOptions): Promise<{ member: CactusMember, mailchimpError?: any }> {
    const {user, pendingUser, transaction, email} = options;
    const userId = user.uid;
    const displayName = user.displayName || "";
    const {firstName, lastName} = destructureDisplayName(displayName);
    const cactusMember = new CactusMember();
    cactusMember.id = userId;
    cactusMember.createdAt = new Date();
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

    const savedMember = await AdminCactusMemberService.getSharedInstance().save(cactusMember, {transaction});

    if (!savedMember) {
        throw new Error("Failed to save cactus member. No member returned")
    }

    return {member: savedMember, mailchimpError: mailchimpError};
}

export async function transactionalOnCreate(user: admin.auth.UserRecord): Promise<void> {
    console.log("Setting up user using new transactional method");
    try {
        const userCheckResult = await setupUserTransaction(user);
        console.log("setupUserTransaction finished", userCheckResult);

        if (userCheckResult.pendingUser && userCheckResult.member && userCheckResult.user) {
            console.log("Pending user was found. Setting up sent prompts from the pending user");
            await AdminSentPromptService.getSharedInstance().initializeSentPromptsFromPendingUser({
                pendingUser: userCheckResult.pendingUser,
                user: userCheckResult.user,
                member: userCheckResult.member
            });
        } else {
            console.log("No pending user was found, not doing anything about sent prompts");
        }


        const slackMessage = createSlackMessage({
            member: userCheckResult.member,
            user: user,
            pendingUser: userCheckResult.pendingUser,
            existingCactusMember: !userCheckResult.isNewMember,
            errorAttachments: userCheckResult.error ? [{text: userCheckResult.error}] : []
        });
        await slackService.sendActivityNotification(slackMessage);

    } catch (error) {
        console.error("Failed to run check for user transaction", error)
    }

    console.log("finished transactionalOnCreate function")
}

/**
 * Create or update a mailchimp list member
 * @param {SubscriptionRequest} subscription
 * @return {Promise<{mailchimpListMember?: ListMember; error?: any}>}
 */
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

interface SlackMessageInput {
    member?: CactusMember,
    user: admin.auth.UserRecord,
    pendingUser?: PendingUser,
    existingCactusMember: boolean,
    errorAttachments: SlackAttachment[]
}

function createSlackMessage(args: SlackMessageInput): SlackMessage {
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


/**
 * Delete a user from the auth. This will clean up related records and send a slack notification.
 * @param {admin.auth.UserRecord} user
 * @return {Promise<void>}
 */
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