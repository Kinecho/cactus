import * as admin from "firebase-admin";
import AdminUserService from "@admin/services/AdminUserService";
import User from "@shared/models/User";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import MailchimpSignupRequest from "@shared/mailchimp/models/SignupRequest";
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
    ChatMessage
} from "@admin/services/AdminSlackService";
import AdminPendingUserService from "@admin/services/AdminPendingUserService";
import PendingUser from "@shared/models/PendingUser";
import AdminSentPromptService from "@admin/services/AdminSentPromptService";
import AdminFirestoreService, {Transaction} from "@admin/services/AdminFirestoreService";
import Logger from "@shared/Logger";
import {getDefaultSubscription} from "@shared/models/MemberSubscription";
const logger = new Logger("UserTriggers");
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
    subscriptionToCreate?: MailchimpSignupRequest
}

/**
 * Using a transaction, create or update the User and CactusMember objects
 * @param {admin.auth.UserRecord} userRecord
 * @return {Promise<UserCheckResult>}
 */
async function setupUserTransaction(userRecord: admin.auth.UserRecord): Promise<UserCheckResult> {
    const userId = userRecord.uid;
    const email = userRecord.email;

    logger.log(`Starting signup process for ${email} userId = ${userId}`);
    try {
        /*
        Note: All read actions must happen first. Then the writes.
         */
        return await AdminFirestoreService.getSharedInstance().firestore.runTransaction(async transaction => {
            logger.log(`Transaction beginning for ${email} userId = ${userId}`);
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

            logger.log("Looking for pending user....");
            const pendingUser = await AdminPendingUserService.getSharedInstance().getPendingByEmail(email, {transaction});

            /*
                END OF THE DB READs SECTION.
                Next up, write to the DB.
             */

            logger.log(`Pending User for email = ${email}`, pendingUser);
            if (pendingUser) {
                logger.log(`Completing pending user signup for ${email}, ${userId}....`);
                result.pendingUser = await AdminPendingUserService.getSharedInstance().completeSignupForPendingUser({
                    pendingUser,
                    userId
                }, {transaction});
                logger.log("Pending user signup completed", result.pendingUser);
            }

            logger.log("\ncreating cactus member....");
            const createMemberResult = await createCactusMember({user: userRecord, pendingUser, transaction, email});
            logger.log(`Cactus Member created ${email}, userId = ${userId}, memberId = ${member && member.id}`, createMemberResult);

            result.member = createMemberResult.member;
            result.mailchimpError = createMemberResult.mailchimpError;

            logger.log("Creating the cactus user....");
            const createUserResult = await createCactusUser({
                user: userRecord,
                member: createMemberResult.member,
                transaction
            });
            logger.log(`Cactus User created ${email}, userId = ${userId}`, createUserResult);

            result.user = createUserResult.user;

            logger.log(`Transaction returning ${email}, ${userId}...`, result);
            return result
        });
    } catch (error) {
        logger.error("Failed to complete signup", error);
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
 * @return {Promise<{member: CactusMember; subscription: MailchimpSignupRequest}>}
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
    cactusMember.subscription = getDefaultSubscription();

    const mailchimpSubscriptionRequest: MailchimpSignupRequest = new MailchimpSignupRequest(email);
    mailchimpSubscriptionRequest.lastName = lastName;
    mailchimpSubscriptionRequest.firstName = firstName;
    mailchimpSubscriptionRequest.referredByEmail = cactusMember.referredByEmail;
    mailchimpSubscriptionRequest.subscriptionTier = cactusMember?.tier;

    const {mailchimpListMember, error: mailchimpError} = await upsertMailchimpSubscriber(mailchimpSubscriptionRequest);
    cactusMember.mailchimpListMember = mailchimpListMember;

    const savedMember = await AdminCactusMemberService.getSharedInstance().save(cactusMember, {transaction});

    if (!savedMember) {
        throw new Error("Failed to save cactus member. No member returned")
    }

    return {member: savedMember, mailchimpError: mailchimpError};
}

export async function transactionalOnCreate(user: admin.auth.UserRecord): Promise<void> {
    logger.log("Setting up user using new transactional method");
    try {
        const userCheckResult = await setupUserTransaction(user);
        logger.log("setupUserTransaction finished", userCheckResult);

        if (userCheckResult.pendingUser && userCheckResult.member && userCheckResult.user) {
            logger.log("Pending user was found. Setting up sent prompts from the pending user");
            await AdminSentPromptService.getSharedInstance().initializeSentPromptsFromPendingUser({
                pendingUser: userCheckResult.pendingUser,
                user: userCheckResult.user,
                member: userCheckResult.member
            });
        } else {
            logger.log("No pending user was found, not doing anything about sent prompts");
        }


        const slackMessage = createSlackMessage({
            member: userCheckResult.member,
            user: user,
            pendingUser: userCheckResult.pendingUser,
            existingCactusMember: !userCheckResult.isNewMember,
            errorAttachments: userCheckResult.error ? [{text: userCheckResult.error}] : []
        });
        await slackService.sendSignupsMessage(slackMessage);

    } catch (error) {
        logger.error("Failed to run check for user transaction", error)
    }

    logger.log("finished transactionalOnCreate function")
}

/**
 * Create or update a mailchimp list member
 * @param {MailchimpSignupRequest} subscription
 * @return {Promise<{mailchimpListMember?: ListMember, error?: any}>}
 */
async function upsertMailchimpSubscriber(subscription: MailchimpSignupRequest): Promise<{ mailchimpListMember?: ListMember, error?: any }> {
    const mailchimpResult = await mailchimpService.addSubscriber(subscription, ListMemberStatus.subscribed);
    if (mailchimpResult.success) {
        let mailchimpMember = mailchimpResult.member;

        if (!mailchimpMember && mailchimpResult.status === SubscriptionResultStatus.existing_subscriber) {
            mailchimpMember = await mailchimpService.getMemberByEmail(subscription.email);
        }

        // mailchimpListMember = mailchimpMember;
        return {mailchimpListMember: mailchimpMember};
    } else {
        logger.error("Failed to create mailchimp subscriber", JSON.stringify(mailchimpResult));//
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

function createSlackMessage(args: SlackMessageInput): ChatMessage {
    const {member, user, existingCactusMember, errorAttachments, pendingUser} = args;

    const fields: SlackAttachmentField[] = [];
    const attachment: SlackAttachment = {fields, color: AttachmentColor.success};
    const attachments = [attachment, ...errorAttachments];
    attachment.title = `:wave: ${user.email || user.phoneNumber} has signed up `;

    const chatMessage: ChatMessage = {
        text: ''
    };

    if (!member) {
        attachments.push({title: `No member was found or created. UserId = ${user.uid}`, color: "danger"});
        return chatMessage;
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

    chatMessage.attachments = attachments;
    attachment.ts = `${(new Date()).getTime() / 1000}`;
    return chatMessage;
}


/**
 * Delete a user from the auth. This will clean up related records and send a slack notification.
 * @param {admin.auth.UserRecord} user
 * @return {Promise<void>}
 */
export async function onDelete(user: admin.auth.UserRecord) {
    const email = user.email;
    logger.log("Deleting user ", JSON.stringify(user.toJSON()));
    if (!email) {
        logger.error("No email found on the user, can't delete.");
        await AdminSlackService.getSharedInstance().sendCustomerSupportMessage(`:warning: User deleted but no email address found. \`\`\`\n${user.toJSON()}\`\`\``);
        return
    }
    try {
        await AdminUserService.getSharedInstance().deleteAllDataPermanently({email, userRecord: user});
        logger.log("finished deleting user with email", email);
    } catch (error) {
        logger.error("Failed to delete user data", error);
        await AdminSlackService.getSharedInstance().sendCustomerSupportMessage(`:warning: User deleted but no email found. \`\`\`\n${error.message}\`\`\``);
    }
}