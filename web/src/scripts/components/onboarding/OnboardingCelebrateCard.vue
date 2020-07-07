<template>
    <div>
        <h1>YAAAS</h1>
        <cactus-confetti :running="true"/>
        <router-link :to="homeHref" tag="button" class="secondary">Go Home</router-link>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import CactusConfetti from "@components/CactusConfetti.vue";
    import { PageRoute } from "@shared/PageRoutes";

    @Component({
        components: {
            CactusConfetti,
        }
    })
    export default class OnboardingCelebrateCard extends Vue {
        name = "OnboardingCelebrateCard";

        get homeHref(): string {
            return PageRoute.MEMBER_HOME;
        }
    }
</script>

<style scoped lang="scss">
    @import "common";
</style>