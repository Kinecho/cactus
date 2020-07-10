<template>
    <div class="legend" :class="{stacked}">
        <div class="importance item">
            <span class="color pink"></span>
            <span class="statLabel">Importance</span>
        </div>
        <div class="satisfaction item">
            <span class="color blue"></span>
            <span class="statLabel">Satisfaction</span>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import { Prop } from "vue-property-decorator";

    @Component
    export default class GapAnalysisLegend extends Vue {
        name = "GapAnalysisLegend";

        @Prop({ type: Boolean, required: false, default: false })
        stacked!: boolean;
    }
</script>

<style scoped lang="scss">
    @import "insights";

    .legend {
        display: flex;
        justify-content: center;
        padding-top: 1.6rem;

        .item {
            align-items: center;
            display: flex;
            margin: .4rem .8rem;

            @include r(600) {
                margin: .4rem 1.6rem;
            }
        }

        &.stacked {
            flex-direction: column;

            .item {
                margin: .4rem 0;
            }
        }
    }

    .color {
        border-radius: 50%;
        height: 1.2rem;
        margin-right: .4rem;
        width: 1.2rem;

        @include r(600) {
            margin-right: .8rem;
        }

        &.pink {
            background-color: $green;
        }
        &.blue {
            background-color: $dolphin;
        }
    }

    .statLabel {
        font-size: 1.4rem;

        @include r(374) {
            font-size: 1.6rem;
        }
    }
</style>
