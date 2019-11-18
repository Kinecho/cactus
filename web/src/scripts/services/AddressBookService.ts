import {Config} from "@web/config";
import {CloudspongeContact, 
        EmailContact, 
        EmailService} from "@shared/types/EmailContactTypes";
import {Endpoint} from "@web/requestUtils";

class AddressBookService {
  public static sharedInstance =new AddressBookService();
  cloudsponge: undefined;

  start(callback?: object) {
    if (!document.getElementById('cloudsponge-' + Config.cloudSpongeKey)) {
      const cloudSpongeScript = document.createElement('script');
            cloudSpongeScript.type = 'text/javascript';
            cloudSpongeScript.async = true;
            cloudSpongeScript.onload = this.initCloudsponge;
            cloudSpongeScript.id = 'cloudsponge-' + Config.cloudSpongeKey;
            cloudSpongeScript.src = 'https://api.cloudsponge.com/widget/' + Config.cloudSpongeKey + '.js';
            document.head.appendChild(cloudSpongeScript);
    }
  }

  initCloudsponge() {
    this.cloudsponge = window.cloudsponge;
  }

  formatContacts(rawContactData: Array<any>): Array<any> {
    const formattedContacts: Array<EmailContact> = [];

    rawContactData.forEach(function(contact: CloudspongeContact, index: number) {
      formattedContacts.push({
        first_name: contact['first_name'],
        last_name: contact['last_name'],
        email: contact.selectedEmail()
      })
    });

    return formattedContacts;
  }

}



export default AddressBookService