import "@styles/pages/sign_up.scss"
import {PageRoute} from "@shared/PageRoutes";
import {getQueryParam} from "@web/util";
import {QueryParam} from "@shared/util/queryParams";
import Vue from "vue";
import SignIn from "@components/SignIn.vue"
import NavBar from "@components/NavBar.vue";
import Footer from "@components/StandardFooter.vue";
import CopyService from "@shared/copy/CopyService";
import {commonInit} from "@web/common";
import Logger from "@shared/Logger";

const logger = new Logger("sign_up.ts");
const copy = CopyService.getSharedInstance().copy;

commonInit();

new Vue({
    el: "#signup-app",
    components: {
        SignIn,
        NavBar,
        Footer,
    },
    template: `
        <div class="page-wrapper">
            <div class="signin-wrapper">
                <NavBar v-bind:showSignup="false" :showLogin="false" v-bind:redirectOnSignOut="false" :isSticky="false" :forceTransparent="true"/>
                <SignIn :message="message" :title="title"/>
            </div>
            <Footer/>
        </div>`,
    data: {
        message: getQueryParam(QueryParam.MESSAGE),
        title: window.location.pathname.startsWith(PageRoute.LOGIN) ? copy.common.LOG_IN : copy.common.SIGN_UP,
    }
});


//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        logger.error("Error accepting hot reload", error);
    })
}