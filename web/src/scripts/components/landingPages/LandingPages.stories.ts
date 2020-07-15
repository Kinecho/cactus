import Vue from "vue";
import WhyCactus from "@components/landingPages/WhyCactus.vue";
import PreFooter from "@components/landingPages/PreFooter.vue";
import Private from "@components/landingPages/Private.vue";
import Testimonials from "@components/landingPages/Testimonials.vue";
import TestimonialCard from "@components/landingPages/TestimonialCard.vue";
import { Testimonial } from "@components/landingPages/TestomonialTypes";
import Hero from "@components/landingPages/Hero.vue";
import PromptGraphicAside from "@components/landingPages/PromptGraphicAside.vue";
export default {
    title: "Landing Page Widgets"
}

export const WhyCactusWidget = () => Vue.extend({
    components: {
        WhyCactus
    },
    template: `
        <div>
            <why-cactus/>
        </div>
    `
})


export const PreFooterWidget = () => Vue.extend({
    components: {
        PreFooter
    },
    template: `
        <div>
            <pre-footer>
                <button>Custom Button via Slots</button>
            </pre-footer>
        </div>
    `
})

export const PrivateAndSecureWidget = () => Vue.extend({
    components: {
        Private
    },
    template: `
        <div>
            <private/>
        </div>
    `
})

export const TestimonialCardWidget = () => Vue.extend({
    components: {
        TestimonialCard,
    },
    data(): { card: Testimonial } {
        return {
            card: {
                name: "Cactus Boy",
                avatarUrl: "/assets/images/avatars/testimonialAvatar3.png",
                quote: "I really love **Cactus** so much that I tell all my friends about it.",
            }
        }
    },
    template: `
        <div>
            <testimonial-card :testimonial="card"/>
        </div>
    `
})

export const TestimonialsWidget = () => Vue.extend({
    components: {
        Testimonials
    },
    template: `
        <div>
            <testimonials/>
        </div>
    `
})


export const HeroWidget = () => Vue.extend({
    components: {
        Hero
    },
    template: `
        <div>
            <hero title="This is a custom title" sub-text="This is the awesome subtxt">
                <button>Custom CTA</button>
            </hero>
        </div>
    `
})

export const PromptGraphicAsideWidget = () => Vue.extend({
    components: {
        PromptGraphicAside
    },
    template: `
        <div>
            <prompt-graphic-aside/>
        </div>
    `
})


