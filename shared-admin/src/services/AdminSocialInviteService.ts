import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import SocialInvite, {SocialInviteField} from "@shared/models/SocialInvite";
import {Collection} from "@shared/FirestoreBaseModels";
import CactusMember from "@shared/models/CactusMember";

let firestoreService: AdminFirestoreService;

export default class AdminSocialInviteService {
    protected static sharedInstance: AdminSocialInviteService;

    static getSharedInstance() {
        if (AdminSocialInviteService.sharedInstance) {
            return AdminSocialInviteService.sharedInstance;
        }
        throw new Error("You must initialize AdminSocialInviteService service before calling getSharedInstance()");
    }

    getCollectionRef() {
        return firestoreService.getCollectionRef(Collection.socialInvites);
    }

    static initialize() {
        firestoreService = AdminFirestoreService.getSharedInstance();
        AdminSocialInviteService.sharedInstance = new AdminSocialInviteService();
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
                console.log('updated SocialInvite record with recipientMemberId');
            } catch (e) {
                console.error("failed to update social invite", e);
            }
            // create a new invite record if one doesn't exist but they were invited
        } else if (invitedByMember) {
            try {
                await AdminSocialInviteService.getSharedInstance().generateInviteRecord(
                    invitedByMember,
                    memberJoined
                );
                console.log('created new SocialInvite record with recipientMemberId');
            } catch (e) {
                console.error("failed to create new social invite", e);
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
}