import AdminSlackService, {
    AttachmentColor,
    ChatMessage,
    SlackAttachment,
    SlackAttachmentField
} from "@admin/services/AdminSlackService";
import {destructureDisplayName, getProviderDisplayName, isBlank} from "@shared/util/StringUtil";
import {formatDate} from "@shared/util/DateUtil";
import * as admin from "firebase-admin";
import CactusMember from "@shared/models/CactusMember";
import AdminFirestoreService, {Transaction} from "@admin/services/AdminFirestoreService";
import User from "@shared/models/User";
import AdminUserService from "@admin/services/AdminUserService";
import {getDefaultSubscription} from "@shared/models/MemberSubscription";
import MailchimpSignupRequest from "@shared/mailchimp/models/SignupRequest";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import AdminPendingUserService from "@admin/services/AdminPendingUserService";
import PendingUser from "@shared/models/PendingUser";
import AdminSentPromptService from "@admin/services/AdminSentPromptService";
import {ListMember, ListMemberStatus} from "@shared/mailchimp/models/MailchimpTypes";
import {SubscriptionResultStatus} from "@shared/mailchimp/models/SubscriptionResult";
import Logger from "@shared/Logger";
import MailchimpService from "@admin/services/MailchimpService";
import {isGeneratedEmailAddress} from "@admin/util/StringUtil";
import {getConfig} from "@admin/config/configService";

const logger = new Logger("AuthUserCreateJob");

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
 * @param {admin.auth.UserRecord} options.userRecord
 * @param {string|undefined} [options.email]
 * @return {Promise<UserCheckResult>}
 */
async function setupUserTransaction(options: { userRecord: admin.auth.UserRecord, email: string | undefined, useAuthDate: boolean }): Promise<UserCheckResult> {
    const {userRecord, email, useAuthDate} = options;
    const userId = userRecord.uid;

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
                email: email
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
                logger.error("No email was provided!", userRecord);
                result.error = "No email passed. Can not set up member.";
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
            const createMemberResult = await createCactusMember({
                user: userRecord,
                pendingUser,
                transaction,
                email,
                useAuthDate
            });
            logger.log(`Cactus Member created ${email}, userId = ${userId}, memberId = ${member && member.id}`, createMemberResult);

            result.member = createMemberResult.member;
            result.mailchimpError = createMemberResult.mailchimpError;

            logger.log("Creating the cactus user....");
            const createUserResult = await createCactusUser({
                user: userRecord,
                member: createMemberResult.member,
                email: email,
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

async function createCactusUser(options: { user: admin.auth.UserRecord, member: CactusMember, email: string, transaction: Transaction }): Promise<{ user: User }> {
    const {user, member, transaction, email} = options;

    const userModel = new User();
    userModel.createdAt = new Date();
    userModel.email = email;
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
    transaction: Transaction,
    useAuthDate: boolean,
}

/**
 * Set up and save a new Cactus member using a transaction
 * @param {CreateMemberOptions} options
 * @return {Promise<{member: CactusMember; subscription: MailchimpSignupRequest}>}
 */
async function createCactusMember(options: CreateMemberOptions): Promise<{ member: CactusMember, mailchimpError?: any }> {
    const {user, pendingUser, transaction, email, useAuthDate} = options;
    const userId = user.uid;
    const displayName = user.displayName || "";
    const {firstName, lastName} = destructureDisplayName(displayName);
    const cactusMember = new CactusMember();
    const authCreatedAt = useAuthDate && !isBlank(user.metadata.creationTime) ? new Date(user.metadata.creationTime) : undefined;
    cactusMember.id = userId;
    cactusMember.createdAt = authCreatedAt ?? new Date();
    cactusMember.userId = user.uid;
    cactusMember.email = email;
    cactusMember.lastName = lastName;
    cactusMember.firstName = firstName;
    cactusMember.signupAt = authCreatedAt ?? new Date();
    cactusMember.signupConfirmedAt = new Date();
    cactusMember.signupQueryParams = pendingUser ? pendingUser.queryParams : {};
    cactusMember.referredByEmail = pendingUser && pendingUser.referredByEmail;
    cactusMember.subscription = getDefaultSubscription();

    let mailchimpErrorResult;

    if (cactusMember.email && !isGeneratedEmailAddress(cactusMember.email)) {
        const mailchimpSubscriptionRequest: MailchimpSignupRequest = new MailchimpSignupRequest(email);
        mailchimpSubscriptionRequest.lastName = lastName;
        mailchimpSubscriptionRequest.firstName = firstName;
        mailchimpSubscriptionRequest.referredByEmail = cactusMember.referredByEmail;
        mailchimpSubscriptionRequest.subscriptionTier = cactusMember?.tier;

        const {mailchimpListMember, error: mailchimpError} = await upsertMailchimpSubscriber(mailchimpSubscriptionRequest);
        cactusMember.mailchimpListMember = mailchimpListMember;

        mailchimpErrorResult = mailchimpError;
    }

    const savedMember = await AdminCactusMemberService.getSharedInstance().save(cactusMember, {transaction});

    if (!savedMember) {
        throw new Error("Failed to save cactus member. No member returned")
    }

    return {member: savedMember, mailchimpError: mailchimpErrorResult};
}

export async function transactionalOnCreate(user: admin.auth.UserRecord, useAuthDate = false): Promise<void> {
    logger.log("Setting up user using new transactional method");
    const email = user.email || generateEmailAddressForUser(user);

    try {
        const userCheckResult = await setupUserTransaction({userRecord: user, email, useAuthDate});
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
        await AdminSlackService.getSharedInstance().sendSignupsMessage(slackMessage);

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
    const mailchimpResult = await MailchimpService.getSharedInstance().addSubscriber(subscription, ListMemberStatus.subscribed);
    if (mailchimpResult.success) {
        let mailchimpMember = mailchimpResult.member;

        if (!mailchimpMember && mailchimpResult.status === SubscriptionResultStatus.existing_subscriber) {
            mailchimpMember = await MailchimpService.getSharedInstance().getMemberByEmail(subscription.email);
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
    const {member, user, existingCactusMember, errorAttachments} = args;

    const fields: SlackAttachmentField[] = [];
    const attachment: SlackAttachment = {fields, color: AttachmentColor.success};
    const attachments = [attachment, ...errorAttachments];
    attachment.title = `:wave: ${member?.email || user.uid} has signed up `;

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

    chatMessage.attachments = attachments;
    attachment.ts = `${(new Date()).getTime() / 1000}`;
    return chatMessage;
}

export function generateEmailAddressForUser(user: admin.auth.UserRecord): string | undefined {
    if (user?.uid && getConfig().app.fake_email_domain) {
        return `${user.uid.trim()}@${getConfig().app.fake_email_domain}`.trim().toLowerCase();
    }

    return undefined;
} 