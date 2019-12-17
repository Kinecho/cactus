import {Config} from "@web/config";
import {CloudspongeContact, EmailContact} from "@shared/types/EmailContactTypes";
import {ImportedContact, ContactStatus} from "@shared/types/ImportedContactTypes";
import MemberProfile from "@shared/models/MemberProfile";
import MemberProfileService from "@web/services/MemberProfileService";

class ImportedContactService {
  public static sharedInstance =new ImportedContactService();

  async prepareImportedContacts(emailContacts: EmailContact[],
                                friendIds: string[], 
                                requestedFriendIds: string[]): Promise<ImportedContact[]> {
    
    const preparedContacts:ImportedContact[] = await Promise.all(emailContacts.map(contact => {
      return new Promise<ImportedContact>(async(resolve, reject) => {
        const memberProfile = await MemberProfileService.sharedInstance.getByEmail(contact.email);
        const statuses: ContactStatus = {
          isMember: (memberProfile ? true : false),
          isFriend: (memberProfile && friendIds.includes(memberProfile.cactusMemberId) ? true : false),
          isRequested: (memberProfile && requestedFriendIds.includes(memberProfile.cactusMemberId) ? true : false)
        };

        const preparedContact: ImportedContact = {
          email_contact: contact,
          statuses: statuses,
          memberId: memberProfile?.cactusMemberId,
          avatarUrl: memberProfile?.avatarUrl
        };

        resolve(preparedContact);
      })
    })); 

    return this.sortContacts(preparedContacts);
  }

  sortContacts(contacts: ImportedContact[]): ImportedContact[] {
    /* We sort them in the following order:
       Contacts to Add
       Contacts to Invite
       Contacts Pending Requested
       Contacts who are Friends
    */
    
    // sorting the mapped array containing the reduced values
    contacts.sort(function(a: ImportedContact, b: ImportedContact) {
      const sortOrderA = getSortOrder(a);
      const sortOrderB = getSortOrder(b);

      if (sortOrderA > sortOrderB) {
        return 1;
      }
      if (sortOrderA < sortOrderB) {
        return -1;
      }
      return 0;
    });

    return contacts;
  }
}

export function getSortOrder(contact: ImportedContact) {
  // contacts to add
  if (contact.statuses.isMember && 
      !contact.statuses.isFriend && 
      !contact.statuses.isRequested) {
    return 0;
  }

  // contacts to invite
  if (!contact.statuses.isMember && 
      !contact.statuses.isFriend && 
      !contact.statuses.isRequested) {
    return 1;
  }

  // contacts pending
  if (contact.statuses.isRequested) {
    return 2;
  }

  // contacts friends
  if (contact.statuses.isFriend) {
    return 3;
  }

  return -1;
}

export default ImportedContactService