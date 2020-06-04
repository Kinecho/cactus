<template>
    <div class="main">
        <onboarding :index="index" @index="setIndex"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import Onboarding from "@components/onboarding/Onboarding.vue";
    import { Prop } from "vue-property-decorator";
    import { pushRoute } from "@web/NavigationUtil";
    import { PageRoute } from "@shared/PageRoutes";

    @Component({
        components: { Onboarding }
    })
    export default class OnboardingPage extends Vue {
        name = "OnboardingPage";

        @Prop({ type: Number, required: false, default: 0 })
        index: number;

        async setIndex(index: number) {
            if (index === 0) {
                await pushRoute(PageRoute.ONBOARDING);
                return
            }
            await pushRoute(`${ PageRoute.ONBOARDING }/${ index }`);
        }
    }
</script>

<style scoped lang="scss">
    @import "variables";

</style>