<template>
    <div>
        <hero title="Mindfulness without meditation" sub-text="Research-backed prompts to increase self-awareness and resilience">
            <router-link :to="mainCtaPath" tag="button" class="mainCta primary">Try It Free</router-link>
        </hero>
        <why-cactus/>
        <split-view>
            <fortify-e-q/>
            <private/>
        </split-view>
        <testimonials/>
        <pre-footer>
            <router-link :to="mainCtaPath" tag="button" class="mainCta primary">Try It Free</router-link>
        </pre-footer>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import AppStoreIcon from "@components/AppStoreIcon.vue";
    import PlayStoreIcon from "@components/PlayStoreIcon.vue";
    import Component from "vue-class-component";
    import { PageRoute } from "@shared/PageRoutes";
    import SignIn from "@components/SignIn.vue";
    import Hero from "@components/landingPages/Hero.vue";
    import PreFooter from "@components/landingPages/PreFooter.vue";
    import Testimonials from "@components/landingPages/Testimonials.vue";
    import Split from "@components/landingPages/Split.vue";
    import Private from "@components/landingPages/Private.vue";
    import FortifyEQ from "@components/landingPages/FortifyEQ.vue";
    import WhyCactus from "@components/landingPages/WhyCactus.vue";

    @Component({
        components: {
            Hero,
            PreFooter,
            Testimonials,
            SplitView: Split,
            Private,
            FortifyEQ,
            WhyCactus,
            SignIn,
            AppStoreIcon,
            PlayStoreIcon,
        }
    })
    export default class MagicMomentMLP extends Vue {
        name = "MagicMomentMLP.vue";

        get mainCtaPath(): string {
            return PageRoute.HELLO_ONBOARDING
        }

    }
</script>

<style scoped lang="scss">
    @import "styles/mixins";
    @import "styles/variables";

    .mainCta {
        min-width: 24rem;
    }

</style>
