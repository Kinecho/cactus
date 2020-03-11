import "@styles/pages/pricing.scss"
import StandardFooter from "@components/StandardFooter.vue";
import NavBar from "@components/NavBar.vue";
import {commonInit} from "@web/common";
import PricingPage from "@components/PricingPage.vue";
import Vue from "vue"

commonInit();

new Vue({
    el: "#app",
    template: `
        <PricingPage/>`,
    components: {PricingPage}
});