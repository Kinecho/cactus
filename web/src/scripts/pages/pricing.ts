import Footer from "@components/StandardFooter.vue";
import NavBar from "@components/NavBar.vue";
import {commonInit} from "@web/common";
import PremiumPricing from "@components/PremiumPricing.vue";

commonInit();

new PremiumPricing({
    el: "#premium-pricing"
});

new NavBar({el: "header"});

new Footer({
    el: "#footer"
});