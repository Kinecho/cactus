<template>
    <legacy-prompt-content v-on:close="redirectToJournal"/>
</template>

<script lang="ts">
    import Vue from "vue";
    import { PageRoute } from "@shared/PageRoutes";
    import LegacyPromptContent from "@components/LegacyPromptContent.vue"
    import Component from "vue-class-component";
    import Logger from "@shared/Logger"
    import { pushRoute } from "@web/NavigationUtil";

    const logger = new Logger("LegacyPromptContentPage.vue");

    @Component({
        components: {
            LegacyPromptContent,
        }
    })
    export default class PromptContentPage extends Vue {
        async redirectToJournal() {
            await pushRoute({ path: PageRoute.MEMBER_HOME });
        }
    }
</script>

<style scoped lang="scss">

</style>