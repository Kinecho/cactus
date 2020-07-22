<template>
    <vue-simple-markdown :source="sourceCopy" class="md_wrapper"/>
</template>

<script lang="ts">
    import Vue from "vue";
    import VueSimpleMarkdown from 'vue-simple-markdown'
    import { preventOrphanedWords } from "@shared/util/StringUtil";

    Vue.use(VueSimpleMarkdown);
    export default Vue.extend({
        props: {
            source: String,
            treatment: String
        },
        computed: {
            sourceCopy(): string {
                if (this.treatment === 'quote') {
                    return preventOrphanedWords(`"${ this.source?.trim() }"`) ?? "";
                }

                return preventOrphanedWords(this.source?.trim()) ?? "";
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .md_wrapper {
        white-space: pre-line;
    }
</style>
