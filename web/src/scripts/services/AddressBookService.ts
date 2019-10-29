import {Config} from "@web/config";

class AddressBookService {
    public static sharedInstance =new AddressBookService();
    cloudsponge: undefined;

    start(callback?: object) {
      if (!document.getElementById('cloudsponge-' + Config.cloudSpongeKey)) {
        let cloudSpongeScript = document.createElement('script');
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

}

export default AddressBookService