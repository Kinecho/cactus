<template>
    <div>
        <h2>Existing assessment {{id}}</h2>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import { Prop } from "vue-property-decorator";

    @Component
    export default class GapAnalysisExistingPage extends Vue {
        name = "GapAnalysisExistingPage";

        @Prop({ type: String, required: true })
        id!: string
    }
</script>

<style scoped lang="scss">

</style>