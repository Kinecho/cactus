// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/privacy_policy.scss"
import NavBar from '@components/NavBar.vue'
import Footer from "@components/StandardFooter.vue";
import {commonInit} from "@web/common";

commonInit();

new NavBar({
    el: "#header"
});

new Footer({
    el: "#footer"
});
