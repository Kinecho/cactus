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

    @Component
    export default class GapAnalysisLegend extends Vue {
        name = "GapAnalysisLegend";

        // @Prop({ type: Boolean, required: false, default: false })
        // stacked!: boolean;
    }
</script>

<style scoped lang="scss">
    @import "insights";

    .legend {
        display: flex;
        justify-content: center;
        padding-top: 4rem;

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
        height: 1.6rem;
        margin-right: .4rem;
        width: 1.6rem;

        @include r(600) {
            margin-right: .8rem;
        }

        &.pink {
            background-color: $magenta;
        }
        &.blue {
            background-color: $royal;
        }
    }
</style>
