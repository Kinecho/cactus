import AdminFirestoreService, {GetOptions, SaveOptions} from "@admin/services/AdminFirestoreService";
import MemberProfile, {MemberProfileConstructor} from "@shared/models/MemberProfile";
import CactusMember from "@shared/models/CactusMember";
import * as admin from "firebase-admin";
import UserRecord = admin.auth.UserRecord;

let firestoreService:AdminFirestoreService;

export default class AdminMemberProfileService {
    protected static sharedInstance:AdminMemberProfileService;

    static getSharedInstance():AdminMemberProfileService {
        if (!AdminMemberProfileService.sharedInstance){
            throw new Error("No shared instance available. Ensure you initialize AdminMemberProfileService before using it");
        }
        return AdminMemberProfileService.sharedInstance;
    }

    static initialize(){
        firestoreService = AdminFirestoreService.getSharedInstance();
        AdminMemberProfileService.sharedInstance = new AdminMemberProfileService();
    }

    async save(model:MemberProfile, options?: SaveOptions):Promise<MemberProfile> {
        return firestoreService.save(model, options);
    }

    async getById(id:string, options: GetOptions):Promise<MemberProfile|undefined>{
        return await firestoreService.getById(id, MemberProfile, options);
    }

    /**
     * Update the public profile for a given cactus member. Default is that all profiles are public.
     *
     * The UserRecord is used to pull off the photoURL, which we don't currently store anywhere else.
     * @param {{member: CactusMember; userRecord?: admin.auth.UserRecord}} args
     * @param {SaveOptions} options
     * @return {Promise<MemberProfile>}
     */
    async upsertMember(args: {member: CactusMember, userRecord?: UserRecord}, options?: SaveOptions) {
        const {member, userRecord} = args;
        const constructorArgs: MemberProfileConstructor = {
            userId: member.userId!,
            cactusMemberId: member.id!,
            firstName: member.firstName,
            lastName: member.lastName,
            email: member.email,
            avatarUrl: userRecord?.photoURL
        };

        const memberProfile = new MemberProfile(constructorArgs);
        return await this.save(memberProfile, options);
    }
}