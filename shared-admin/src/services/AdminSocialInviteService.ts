import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import SocialInvite, {SocialInviteField} from "@shared/models/SocialInvite";
import {Collection} from "@shared/FirestoreBaseModels";
import CactusMember from "@shared/models/CactusMember";
import Logger from "@shared/Logger";
import {InvitationSendResult} from "@shared/types/SocialInviteTypes";
import {generateReferralLink} from "@shared/util/SocialInviteUtil";
import AdminSendgridService from "@admin/services/AdminSendgridService";
import {EmailContact} from "@shared/types/EmailContactTypes";
import {CactusConfig} from "@shared/CactusConfig";
import * as Sentry from "@sentry/node";
import {AppType} from "@shared/models/ReflectionResponse";

const logger = new Logger("AdminSocialInviteService");
let firestoreService: AdminFirestoreService;
export default class AdminSocialInviteService {
    protected static sharedInstance: AdminSocialInviteService;
    config: CactusConfig;

    static getSharedInstance() {
        if (AdminSocialInviteService.sharedInstance) {
            return AdminSocialInviteService.sharedInstance;
        }
        throw new Error("You must initialize AdminSocialInviteService service before calling getSharedInstance()");
    }

    getCollectionRef() {
        return firestoreService.getCollectionRef(Collection.socialInvites);
    }

    static initialize(config: CactusConfig) {
        firestoreService = AdminFirestoreService.getSharedInstance();
        AdminSocialInviteService.sharedInstance = new AdminSocialInviteService(config);
    }

    constructor(config: CactusConfig) {
        this.config = config;
    }

    async save(model: SocialInvite): Promise<SocialInvite> {
        return firestoreService.save(model);
    }

    async getByInviteId(id?: string): Promise<SocialInvite | undefined> {
        if (!id) {
            return;
        }
        return await firestoreService.getById(id, SocialInvite);
    }

    async updateMemberInvite(member: CactusMember): Promise<SocialInvite | undefined> {
        if (member.signupQueryParams.inviteId) {
            const socialInvite = await firestoreService.getById(member.signupQueryParams.inviteId, SocialInvite);
            if (socialInvite && member) {
                socialInvite.recipientMemberId = member.id;
                return firestoreService.save(socialInvite);
            }
        }

        return;
    }

    async generateInviteRecord(invitedByMember: CactusMember, memberJoined: CactusMember): Promise<SocialInvite | undefined> {
        const socialInvite = new SocialInvite();
        socialInvite.senderMemberId = invitedByMember.id;
        socialInvite.recipientMemberId = memberJoined.id;
        socialInvite.recipientEmail = memberJoined.email;
        socialInvite.sentAt = new Date();

        return await AdminSocialInviteService.getSharedInstance().save(socialInvite);
    }

    async handleMemberJoined(memberJoined: CactusMember, invitedByMember: CactusMember | undefined) {
        // update existing invite record
        if (memberJoined.signupQueryParams.inviteId) {
            try {
                await AdminSocialInviteService.getSharedInstance().updateMemberInvite(memberJoined);
                logger.log('updated SocialInvite record with recipientMemberId');
            } catch (e) {
                logger.error("failed to update social invite", e);
            }
            // create a new invite record if one doesn't exist but they were invited
        } else if (invitedByMember) {
            try {
                await AdminSocialInviteService.getSharedInstance().generateInviteRecord(
                    invitedByMember,
                    memberJoined
                );
                logger.log('created new SocialInvite record with recipientMemberId');
            } catch (e) {
                logger.error("failed to create new social invite", e);
            }
        }
    }

    async deleteSocialInvitesPermanently(options: { memberIds?: string[], email?: string }): Promise<number> {
        const {memberIds = [], email} = options;
        let total = 0;
        const tasks = memberIds.map(memberId => {
            new Promise(async resolve => {
                const senderQuery = this.getCollectionRef().where(SocialInviteField.senderMemberId, "==", memberId);
                total += (await firestoreService.deleteForQuery(senderQuery, SocialInvite)).filter(Boolean).length;

                const recipientQuery = this.getCollectionRef().where(SocialInviteField.recipientMemberId, "==", memberId);
                total += (await firestoreService.deleteForQuery(recipientQuery, SocialInvite)).filter(Boolean).length;
                resolve(total)
            })
        });
        await Promise.all(tasks);

        if (email) {
            const emailQuery = this.getCollectionRef().where(SocialInviteField.recipientEmail, "==", email);
            total += (await firestoreService.deleteForQuery(emailQuery, SocialInvite)).filter(Boolean).length;
        }

        return total;
    }

    async createAndSendSocialInvite(options: { member: CactusMember, toContact: EmailContact, message?: string, appType?: AppType }): Promise<InvitationSendResult> {
        const {member, toContact, message, appType} = options;
        const memberId = member.id;
        const fromEmail = member.email;
        const result: InvitationSendResult = {
            success: false,
            sentSuccess: false,
            toEmail: toContact.email,
            toFirstName: toContact.first_name,
            toLastName: toContact.last_name,
        };


        if (!memberId || !fromEmail) {
            result.error = `Either the memberId or memberEmail was not found on the provided cactus member. MemberId = ${member.id} | MemberEmail = ${member.email}`;
            result.errorMessage = `The sending user was missing required fields memberId or email`;
            return result;
        }

        const domain = this.config.web.domain;
        const protocol = this.config.web.protocol;

        const socialInvite = new SocialInvite();
        socialInvite.sourceApp = appType;
        socialInvite.senderMemberId = memberId;
        socialInvite.recipientEmail = toContact.email;
        await this.save(socialInvite);

        result.socialInviteId = socialInvite.id;

        logger.log(`Successfully saved socialInvite ${socialInvite.id}`);

        const referralLink: string =
            generateReferralLink({
                member: member,
                utm_source: 'cactus.app',
                utm_medium: 'invite-contact',
                domain: `${protocol}://${domain}`,
                social_invite_id: (socialInvite ? socialInvite.id : undefined)
            });

        try {
            const sentSuccess = await AdminSendgridService.getSharedInstance().sendInvitation({
                toEmail: toContact.email,
                fromEmail: fromEmail,
                fromName: member ? member.getFullName() : undefined,
                message: message,
                link: referralLink
            });

            result.sentSuccess = sentSuccess;
            result.success = true;

            if (sentSuccess) {
                // update the SocialInvite record with the sentAt date
                socialInvite.sentAt = new Date();
                await AdminSocialInviteService.getSharedInstance().save(socialInvite);
            } else {
                logger.error('Unable to send invite for SocialConnectionRequest ' + socialInvite.id + 'via email.');
            }

        } catch (error) {
            Sentry.captureException(error);
            logger.error(`Error creating/sending invitation to ${toContact.email}. Sender: ${fromEmail} (${memberId})`, error);
            result.error = error;

        }

        return result;
    }
}