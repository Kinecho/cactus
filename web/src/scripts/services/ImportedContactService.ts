import {Config} from "@web/config";
import {CloudspongeContact, EmailContact} from "@shared/types/EmailContactTypes";
import {ImportedContact, ContactStatus} from "@shared/types/ImportedContactTypes";
import MemberProfile from "@shared/models/MemberProfile";
import MemberProfileService from "@web/services/MemberProfileService";

class ImportedContactService {
  public static sharedInstance =new ImportedContactService();

  prepareImportedContacts(emailContacts: Array<EmailContact>,
                          friendIds?: Array<string | undefined>, 
                          requestedFriendIds?: Array<string | undefined>): ImportedContact[] {
    const preparedContacts: Array<ImportedContact> = [];

    emailContacts.forEach(async function(contact: EmailContact) {
      const memberProfile = await MemberProfileService.sharedInstance.getByEmail(contact.email);

      const statuses: ContactStatus = {
        isMember: (memberProfile ? true : false),
        isFriend: (friendIds?.includes(memberProfile?.cactusMemberId) ? true : false),
        isRequested: (requestedFriendIds?.includes(memberProfile?.cactusMemberId) ? true : false)
      }

      const preparedContact: ImportedContact = {
        email_contact: contact,
        statuses: statuses,
        memberId: memberProfile?.cactusMemberId,
        avatarUrl: memberProfile?.avatarUrl
      }

      preparedContacts.push(preparedContact);
    });

    return preparedContacts;
  }

}



export default ImportedContactService