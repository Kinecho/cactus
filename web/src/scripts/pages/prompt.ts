// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/prompt.scss"
import Vue from "vue";
import PromptPage from "@components/PromptContent.vue";
import NavBar from "@components/NavBar.vue";
import Footer from "@components/StandardFooter.vue";
import {PageRoute} from "@shared/PageRoutes";
import {getAuth} from "@web/firebase";
import {getQueryParam, removeQueryParam} from "@web/util";
import {QueryParam} from "@shared/util/queryParams";

import {commonInit} from "@web/common";

commonInit();



const emailParam = getQueryParam(QueryParam.EMAIL);

if (emailParam) {
    getAuth().onAuthStateChanged(user => {
        if (!user) {
            console.log("auth state changed, user is not logged in");
            const message = getQueryParam(QueryParam.MESSAGE) || "To begin reflecting, please sign in.";
            removeQueryParam(QueryParam.MESSAGE);
            const url = window.location.href;

            window.location.href = `${PageRoute.SIGNUP}?${QueryParam.REDIRECT_URL}=${url}&${QueryParam.MESSAGE}=${encodeURIComponent(message)}`;
        } else {
            console.log("auth state changed, user is logged in");
            renderPromptComponent();
        }
    })
} else {
    console.log("not requiring login");
    renderPromptComponent();
}

function renderPromptComponent() {
    console.log("rendering prompt component");
    new Vue({
        el: "#app",
        template: `<div class="prompt-page">
    <NavBar v-bind:isSticky="false"/>
    <Prompt v-on:close="redirectToJournal"/>
</div>`,
        components: {
            Prompt: PromptPage,
            NavBar,
            Footer,
        }, methods: {
            redirectToJournal(): void {
                window.location.href = PageRoute.JOURNAL_HOME;
            }
        }
    });

}


//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        console.error("Error accepting hot reload", error);
    })
}