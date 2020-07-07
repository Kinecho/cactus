<template>
    <div>
        <NavBar
                :is-sticky="true"
                :show-signup="true"
                :large-logo-on-desktop="true"
                :show-login="true"
                :login-redirect-url="signUpUrl"
        />
        <marketing-home/>
        <StandardFooter :lifted="true"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import MarketingHome from "@components/MarketingHome.vue";
    import NavBar from "@components/NavBar.vue";
    import StandardFooter from "@components/StandardFooter.vue";
    import { PageRoute } from "@shared/PageRoutes";

    export default Vue.extend({
        name: "HomePage",
        components: {
            MarketingHome,
            NavBar,
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