
<template>
    <vue-simple-markdown :source="source" class="md_wrapper"/>
</template>

<script lang="ts">
    import Vue from "vue";
    import VueSimpleMarkdown from 'vue-simple-markdown'

    Vue.use(VueSimpleMarkdown);
    export default Vue.extend({
        props: {
            source: String
        },
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
