<template>
    <div>
        <router-view/>
        <standard-footer :lifted="footerLifted" v-if="showFooter"/>
    </div>

</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import StandardFooter from "@components/StandardFooter.vue";
    import { doShowFooter, getFooterConfig } from "@web/router-meta";

    @Component({
        components: {
            StandardFooter,
        }
    })
    export default class LandingPage extends Vue {
        name = "LandingPage";

        get showFooter() {
            return doShowFooter(this.$route);
        }

        get footerLifted() {
            return getFooterConfig(this.$route)?.lifted ?? false;
        }
    }
</script>

<style scoped lang="scss">

</style>