// tslint:disable-next-line:no-implicit-dependencies
// import "@styles/pages/account_settings.scss"
import Vue from "vue";
import AccountSettings from "@components/AccountSettings.vue"
import {commonInit} from "@web/common";

commonInit();

new Vue({
    el: "#app",
    template: `<AccountSettings/>`,
    components: {
        AccountSettings,
    }
});

//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        console.error("Error accepting hot reload", error);
    })
}