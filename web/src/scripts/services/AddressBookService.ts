import {Config} from "@web/config";

class AddressBookService {
    static sharedInstance =new AddressBookService();

    constructor() {
      let cloudSpongeScript = document.createElement('script');
          cloudSpongeScript.setAttribute('src', 'https://api.cloudsponge.com/widget/' + Config.cloudSpongeKey + '.js');
          document.head.appendChild(cloudSpongeScript);
    }

}

export default AddressBookService