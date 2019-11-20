// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/terms_of_service.scss"
// import {initializeArticlePage} from "@web/articleCommon";
import Footer from "@components/StandardFooter.vue";
import NavBar from "@components/NavBar.vue";
import {commonInit} from "@web/common";

commonInit();

new NavBar({el: "#header"});

new Footer({
    el: "#footer"
});
// initializeArticlePage();
