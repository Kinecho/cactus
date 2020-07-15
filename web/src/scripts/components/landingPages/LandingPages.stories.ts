import Vue from "vue";
import Component from "vue-class-component";
import WhyCactus from "@components/landingPages/WhyCactus.vue";

export default {
    title: "Landing Page Widgets"
}

export const WhyWidget = () => Vue.extend({
    components: {
        WhyCactus
    },
    template: `    
    <div>
        <why-cactus/>
    </div>
    `
})