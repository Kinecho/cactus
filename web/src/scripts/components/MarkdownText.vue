
<template>
    <vue-simple-markdown :source="source"/>
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

</style>
