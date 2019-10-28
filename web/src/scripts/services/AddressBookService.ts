import addressBookConnector from 'address-book-connector.js';
import {Config} from "@web/config";

class AddressBookService {
    static sharedInstance =new AddressBookService();

    constructor() {
        addressBookConnector.setOptions({
            key: Config.cloudSpongeKey,
        });
    }

}

export default AddressBookService