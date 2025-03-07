declare module '*.vue' {
    import Vue from "vue";
    export default Vue;
}

declare module 'vue-simple-markdown' {
    import { PluginObject } from "vue";
    const VueSimpleMarkdown: PluginObject<any>;
    export default VueSimpleMarkdown;
}
