<template>
    <div class="main">
        <onboarding/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import Onboarding from "@components/onboarding/Onboarding.vue";

    @Component({
        components: { Onboarding }
    })
    export default class OnboardingPage extends Vue {
        name = "OnboardingPage";
    }
</script>

<style scoped lang="scss">
    @import "variables";

</style>