import {BaseModel, Collection} from "@shared/FirestoreBaseModels";

export default class MemberEmailChangeLog extends BaseModel {
    collection = Collection.memberEmailChangeLogs;
    previousEmail!: string;
    nextEmail!: string;
    memberId!: string;

    static create(options: { previous: string, next: string, memberId: string }): MemberEmailChangeLog {
        const {previous, next, memberId} = options;
        const log = new MemberEmailChangeLog();
        log.previousEmail = previous;
        log.nextEmail = next;
        log.memberId = memberId;

        return log;
    }
}