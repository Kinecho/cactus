declare module '*.vue' {
    import Vue from "vue";
    export default Vue;
}




declare module 'vue-virtual-scroll-list' {
    import Vue from "vue"
    export default Vue
}


declare module 'vue-clipboard2' {
    import {PluginObject} from 'vue';
    const VueClipboard: PluginObject<any>;
    export default VueClipboard;
}

declare module 'vue-social-sharing' {
    import {PluginObject} from 'vue';
    const SocialSharing: PluginObject<any>;
    export default SocialSharing;
}

declare module 'vue-simple-markdown' {
    import {PluginObject} from "vue";
    const VueSimpleMarkdown: PluginObject<any>;
    export default VueSimpleMarkdown;
}

interface Window {
    [key: string]: any; // Add index signature
}

interface FirebaseObject {
    [key: string]: any;
}

interface HTMLElement {
    __vueClickOutside__: EventListenerOrEventListenerObject | null
}

interface NodeModule {
    hot: any,
}


interface Navigator {
    share: (options: { title?: string, url?: string, text?: string }) => Promise<void | any>
}