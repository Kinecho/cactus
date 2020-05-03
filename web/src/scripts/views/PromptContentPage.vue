<template>
    <Prompt v-on:close="redirectToJournal"/>
</template>

<script lang="ts">
    import Vue from "vue";
    import { PageRoute } from "@shared/PageRoutes";
    import Prompt from "@components/PromptContent.vue"
    import Component from "vue-class-component";
    import Logger from "@shared/Logger"

    const logger = new Logger("PromptContentPage");

    @Component({
        components: {
            Prompt,
        }
    })
    export default class PromptContentPage extends Vue {
        redirectToJournal() {
            this.$router.push({ path: PageRoute.JOURNAL_HOME }).catch(error => {
                if (error.name !== "NavigationDuplicated") {
                    logger.error(error)
                }
            });
        }
    }
</script>

<style scoped lang="scss">

</style>