import {Config} from "@web/config";
import {CloudspongeContact, EmailContact} from "@shared/types/EmailContactTypes";
import {ImportedContact, ContactStatus} from "@shared/types/ImportedContactTypes";
import MemberProfile from "@shared/models/MemberProfile";
import MemberProfileService from "@web/services/MemberProfileService";

class ImportedContactService {
  public static sharedInstance =new ImportedContactService();

  async prepareImportedContacts(emailContacts: EmailContact[],
                                friendIds?: string[], 
                                requestedFriendIds?: string[]): Promise<ImportedContact[]> {
    const preparedContacts: ImportedContact[] = [];

    for (const contact of emailContacts) {
      const memberProfile = await MemberProfileService.sharedInstance.getByEmail(contact.email);

      const statuses: ContactStatus = {
        isMember: (memberProfile ? true : false),
        isFriend: (memberProfile && friendIds?.includes(memberProfile.cactusMemberId) ? true : false),
        isRequested: (memberProfile && requestedFriendIds?.includes(memberProfile.cactusMemberId) ? true : false)
      }

      const preparedContact: ImportedContact = {
        email_contact: contact,
        statuses: statuses,
        memberId: memberProfile?.cactusMemberId,
        avatarUrl: memberProfile?.avatarUrl
      }

      preparedContacts.push(preparedContact);
    };

    return this.sortContacts(preparedContacts);
  }

  sortContacts(contacts: ImportedContact[]): ImportedContact[] {
    /* We sort them in the following order:
       Contacts to Add
       Contacts to Invite
       Contacts Pending Requested
       Contacts who are Friends
    */

    // contacts to add
    const canFriend = contacts.filter(function(contact: ImportedContact) {
      return (contact.statuses.isMember && 
              !contact.statuses.isFriend && 
              !contact.statuses.isRequested);
    });

    // contacts to invite
    const canInvite = contacts.filter(function(contact: ImportedContact) {
      return (!contact.statuses.isMember && 
              !contact.statuses.isFriend && 
              !contact.statuses.isRequested);
    });

    // contacts pending
    const isPending = contacts.filter(function(contact: ImportedContact) {
      return contact.statuses.isRequested;
    });

    // contacts friends
    const isFriend = contacts.filter(function(contact: ImportedContact) {
      return contact.statuses.isFriend;
    });

    return canFriend.concat(canInvite).concat(isPending).concat(isFriend);
  }

}



export default ImportedContactService