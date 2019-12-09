import StandardFooter from "@components/StandardFooter.vue";
import NavBar from "@components/NavBar.vue";
import {commonInit} from "@web/common";
import PremiumPricing from "@components/PremiumPricing.vue";
import Vue from "vue"

commonInit();

new Vue({
    el: "#app",
    components: {
        NavBar,
        StandardFooter,
        PremiumPricing,
    },
    template: `
        <div>
            <NavBar/>
            <PremiumPricing/>
            <footer></footer><StandardFooter/>
        </div>`
});