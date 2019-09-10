// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/privacy_policy.scss"
import {initializeArticlePage} from "@web/articleCommon";
import Footer from "@components/StandardFooter.vue";
import {commonInit} from "@web/common";

commonInit();

new Footer({
    el: "#footer"
});
initializeArticlePage();

document.addEventListener('DOMContentLoaded', () => {
    console.log("privacy_policy loaded");
});
