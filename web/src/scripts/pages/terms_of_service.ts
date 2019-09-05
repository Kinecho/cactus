// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/terms_of_service.scss"
import {initializeArticlePage} from "@web/articleCommon";
import Footer from "@components/StardardFooter.vue";
import {commonInit} from "@web/common";

commonInit();

new Footer({
    el: "#footer"
});
initializeArticlePage();


document.addEventListener('DOMContentLoaded', () => {
    console.log("terms_of_service loaded");
});

