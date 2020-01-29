// @ts-ignore
import "@styles/pages/android_welcome.scss"
import AndroidWelcome from "@components/AndroidWelcome.vue"
import Vue from "vue";
import {commonInit} from "@web/common";
import Logger from "@shared/Logger";
import NavBar from "@components/NavBar.vue";

const logger = new Logger("AndroidWelcome");
commonInit();

new Vue({
    el: "#app",
    components: {
        AndroidWelcome,
        NavBar,
    },
    template: `
        <div class="page-wrapper">
            <div class="signin-wrapper">
                <NavBar v-bind:showSignup="false" :showLogin="false" v-bind:redirectOnSignOut="false" :isSticky="false" :forceTransparent="true" :largeLogoOnDesktop="true" :whiteLogo="true"/>
                <AndroidWelcome/>
            </div>
        </div>`,
});

//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        logger.error("Error accepting hot reload", error);
    })
}
