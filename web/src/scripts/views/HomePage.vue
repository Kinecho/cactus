<template>
    <div>
        <magic-moment-onboarding/>
        <StandardFooter :lifted="true"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import MagicMomentOnboarding from "@web/views/marketing/MagicMomentMLP.vue";
    import StandardFooter from "@components/StandardFooter.vue";
    import { PageRoute } from "@shared/PageRoutes";

    export default Vue.extend({
        name: "HomePage",
        components: {
            MagicMomentOnboarding,
            StandardFooter,
        },
        data(): { signUpUrl: string } {
            return {
                signUpUrl: PageRoute.MEMBER_HOME,
            }

        }
    })
</script>

<style scoped lang="scss">

</style>