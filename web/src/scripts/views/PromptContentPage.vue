<template>
    <Prompt v-on:close="redirectToJournal"/>
</template>

<script lang="ts">
    import Vue from "vue";
    import { PageRoute } from "@shared/PageRoutes";
    import Prompt from "@components/PromptContent.vue"
    import Component from "vue-class-component";
    import Logger from "@shared/Logger"
    import { pushRoute } from "@web/NavigationUtil";

    const logger = new Logger("PromptContentPage");

    @Component({
        components: {
            Prompt,
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