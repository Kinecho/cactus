import {Config} from "@web/config";

class AddressBookService {
    static sharedInstance =new AddressBookService();

    start() {
      if (!document.getElementById('cloudsponge-' + Config.cloudSpongeKey)) {
        let cloudSpongeScript = document.createElement('script');
            cloudSpongeScript.setAttribute('id', 'cloudsponge-' + Config.cloudSpongeKey);
            cloudSpongeScript.setAttribute('src', 'https://api.cloudsponge.com/widget/' + Config.cloudSpongeKey + '.js');
            document.head.appendChild(cloudSpongeScript);
        this.initCloudsponge();
      }
    }

    initCloudsponge() {
      if (window.cloudsponge) {
          window.cloudsponge.init({
            include:['name','email']
          });
      } else {
        console.log('Cloudsponge global not yet available');
        setTimeout(this.initCloudsponge, 500);
      }
    }
}

export default AddressBookService