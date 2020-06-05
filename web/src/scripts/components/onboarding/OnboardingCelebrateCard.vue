<template>
    <div>
        <h1>YAAAS</h1>
        <cactus-confetti :running="true"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import CactusConfetti from "@components/CactusConfetti.vue";

    @Component({
        components: {
            CactusConfetti,
        }
    })
    export default class OnboardingCelebrateCard extends Vue {
        name = "OnboardingCelebrateCard";
    }
</script>

<style scoped lang="scss">

</style>