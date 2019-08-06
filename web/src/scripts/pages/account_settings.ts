// tslint:disable-next-line:no-implicit-dependencies
// import "@styles/pages/account_settings.scss"
import Vue from "vue";
import AccountSettings from "@components/AccountSettings.vue"


new Vue({
    el: "#app",
    template: `<AccountSettings/>`,
    components: {
        AccountSettings,
    }
});

