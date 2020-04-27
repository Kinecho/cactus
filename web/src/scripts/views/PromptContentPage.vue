<template>
    <Prompt v-on:close="redirectToJournal"/>
</template>

<script lang="ts">
    import Vue from "vue";
    import { PageRoute } from "@shared/PageRoutes";
    import Prompt from "@components/PromptContent.vue"
    import Component from "vue-class-component";

    @Component({
        components: {
            Prompt,
        }
    })
    export default class PromptContentPage extends Vue {


        redirectToJournal() {
            this.$router.push({ path: PageRoute.JOURNAL_HOME });
        }
    }
</script>

<style scoped lang="scss">

</style>