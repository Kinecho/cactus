import CactusMember from "@shared/models/CactusMember";

class JournalFeedDataSource {
    member: CactusMember;

    // sentP

    constructor(member: CactusMember) {
        this.member = member;

    }

    deinit() {
        console.log("deinit");
    }

}

export default JournalFeedDataSource