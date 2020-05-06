<template>
    <modal :show="show" :show-close-button="false">
        <assessment @close="close" slot="body" :assessment="assessment"/>
    </modal>
</template>

<script lang="ts">
    import Vue from "vue";
    import Modal from "@components/Modal.vue";
    import { Prop } from "vue-property-decorator";
    import Component from "vue-class-component";
    import Assessment from "@components/gapanalysis/Assessment.vue";
    import GapAnalysisAssessment from "@shared/models/GapAnalysisAssessment";

    @Component({
        components: {
            Modal,
            Assessment,
        }
    })
    export default class GapAssessmentModal extends Vue {
        name = "GapAssessmentModal"

        @Prop({ type: Boolean, required: true, default: false })
        show = false

        assessment = GapAnalysisAssessment.create();

        close() {
            this.$emit("close")
        }
    }
</script>

<style scoped lang="scss">

</style>