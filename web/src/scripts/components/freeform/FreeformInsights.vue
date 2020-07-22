<template>
    <div>
        <h1>results</h1>
        <spinner v-if="loading" message="Gathering insights..."/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import ReflectionResponse from "@shared/models/ReflectionResponse";
    import { Prop } from "vue-property-decorator";
    import ToneAnalysis from "@components/ToneAnalysis.vue";
    import Spinner from "@components/Spinner.vue";

    @Component({
        components: {
            ToneAnalysis,
            Spinner,
        }
    })
    export default class FreeformInsights extends Vue {
        name = "FreeformInsights";

        @Prop({type: Object as () => ReflectionResponse, required: true})
        reflection!: ReflectionResponse;

        get loading(): boolean {
            return this.reflection.mightNeedInsightsUpdate ?? false;
        }

    }
</script>

<style scoped lang="scss">

</style>