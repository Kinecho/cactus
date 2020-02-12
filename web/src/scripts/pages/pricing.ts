import StandardFooter from "@components/StandardFooter.vue";
import NavBar from "@components/NavBar.vue";
import {commonInit} from "@web/common";
import PremiumPricing from "@components/PremiumPricing.vue";
import Vue from "vue"

commonInit();

new Vue({
    el: "header",
    template: `
        <NavBar/>`,
    components: {NavBar}
});

new Vue({
    el: "#premium-pricing",
    template: `
        <PremiumPricing/>`,
    components: {PremiumPricing: PremiumPricing}
});

new Vue({
    el: "footer",
    template: `
        <StandardFooter/>`,
    components: {StandardFooter}
});
