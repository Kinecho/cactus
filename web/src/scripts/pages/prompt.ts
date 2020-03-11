// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/prompt.scss"
import Vue from "vue";
import PromptPage from "@components/PromptContent.vue";
import Footer from "@components/StandardFooter.vue";
import {PageRoute} from "@shared/PageRoutes";
import {getAuth} from "@web/firebase";
import {getQueryParam, removeQueryParam} from "@web/util";
import {QueryParam} from "@shared/util/queryParams";
import {commonInit} from "@web/common";
import Logger from "@shared/Logger";

const logger = new Logger("prompt.ts");

commonInit();

const emailParam = getQueryParam(QueryParam.EMAIL);

if (emailParam) {
    getAuth().onAuthStateChanged(user => {
        if (!user) {
            logger.log("auth state changed, user is not logged in");
            const message = getQueryParam(QueryParam.MESSAGE) || "To begin reflecting, please sign in.";
            removeQueryParam(QueryParam.MESSAGE);
            const url = window.location.href;

            window.location.href = `${PageRoute.SIGNUP}?${QueryParam.REDIRECT_URL}=${url}&${QueryParam.MESSAGE}=${encodeURIComponent(message)}`;
        } else {
            logger.log("auth state changed, user is logged in");
            renderPromptComponent();
        }
    })
} else {
    logger.log("not requiring login");
    renderPromptComponent();
}

function renderPromptComponent() {
    logger.log("rendering prompt component");
    new Vue({
        el: "#app",
        template: `<div class="prompt-page">
    <Prompt v-on:close="redirectToJournal"/>
</div>`,
        components: {
            Prompt: PromptPage,
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
        logger.error("Error accepting hot reload", error);
    })
}
