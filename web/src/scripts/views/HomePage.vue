<template>
    <div>
        <marketing-home/>
        <StandardFooter :lifted="true"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import MarketingHome from "@components/MarketingHome.vue";
    import StandardFooter from "@components/StandardFooter.vue";
    import { PageRoute } from "@shared/PageRoutes";

    export default Vue.extend({
        name: "HomePage",
        components: {
            MarketingHome,
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