<template>
    <div>
        <NavBarv/>
        <PrivacyPolicy/>
        <StandardFooter/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import StandardFooter from "@components/StandardFooter.vue";
    import NavBar from "@components/NavBar.vue";
    import PrivacyPolicy from "@components/PrivacyPolicy.vue";

    export default Vue.extend({
        name: "PrivacyPolicyPage",
        components: {
            NavBar,
            PrivacyPolicy,
            StandardFooter,
        }
    })
</script>

<style scoped lang="scss">

</style>