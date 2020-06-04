<template>
    <div>
        <NavBar/>
        <TermsOfService/>
        <StandardFooter/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import NavBar from "@components/NavBar.vue";
    import TermsOfService from "@components/TermsOfService.vue";
    import StandardFooter from "@components/StandardFooter.vue";

    export default Vue.extend({
        name: "TermsOfServicePage",
        components: {
            NavBar,
            TermsOfService,
            StandardFooter,
        }
    })
</script>

<style scoped lang="scss">

</style>