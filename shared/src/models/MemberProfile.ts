import {BaseModel, Collection} from "@shared/FirestoreBaseModels";

export interface MemberProfileConstructor {
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    email?: string;
    cactusMemberId: string;
    userId: string;
    isPublic?: boolean
}

export enum MemberProfileField {
    email = "email",
    firstName = "firstName",
    lastName = "lastName",
    userId = "userId",
    cactusMemberId = "cactusMemberId",
    isPublic = "isPublic"
}

export default class MemberProfile extends BaseModel {
    readonly collection = Collection.memberProfiles;
    static Field = MemberProfileField;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    email?: string;
    cactusMemberId!: string;
    userId!: string;
    isPublic: boolean = true;

    constructor(options?: MemberProfileConstructor) {
        super();
        if (options) {
            this.id = options.cactusMemberId;
            this.cactusMemberId = options.cactusMemberId;
            this.userId = options.userId;
            this.avatarUrl = options.avatarUrl;
            this.firstName = options.firstName;
            this.lastName = options.lastName;
            this.email = options.email;
            if (options.isPublic !== undefined && options.isPublic !== null) {
                this.isPublic = options.isPublic
            }
        }
    }

    getFullName(): string {
        return `${this.firstName ? this.firstName : ''} ${this.lastName ? this.lastName : ''}`.trim()
    }
}