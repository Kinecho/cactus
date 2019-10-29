declare module '*.vue' {
    import Vue from "vue";
    export default Vue;
}

declare module 'vue-clipboard2' {
  import { PluginObject } from 'vue';
  const VueClipboard: PluginObject<any>;
  export default VueClipboard;
}

declare module 'vue-social-sharing' {
  import { PluginObject } from 'vue';
  const SocialSharing: PluginObject<any>;
  export default SocialSharing;
}

declare module 'vue-simple-markdown'{
    import {PluginObject} from "vue";
    const VueSimpleMarkdown: PluginObject<any>;
    export default VueSimpleMarkdown;
}

declare module '@cloudsponge/address-book-connector.js' {
  import { PluginObject } from 'vue';
  const addressBookConnector: PluginObject<any>;
  export default addressBookConnector;
}

interface Window {
    [key:string]: any; // Add index signature
}

interface FirebaseObject {
    [key:string]: any;
}

interface HTMLElement {
    __vueClickOutside__: EventListenerOrEventListenerObject|null
}

interface NodeModule {
    hot: any,
}