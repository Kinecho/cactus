<template>
    <div class="legend">
        <div class="importance pink item">
            <span class="color pink"></span>
            <span class="label">Importance</span>
        </div>
        <div class="satisfaction blue item">
            <span class="color blue"></span>
            <span class="label">Satisfaction</span>
        </div>

    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"

    @Component
    export default class GapAnalysisLegend extends Vue {
        name = "GapAnalysisLegend";
    }
</script>

<style scoped lang="scss">
    @import "insights";

    $pink: $magenta;
    $blue: $royal;

    .legend {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;

        .pink {
            color: $pink;

            .color {
                background-color: $pink;
            }
        }

        .blue {
            color: $blue;

            .color {
                background-color: $blue;
            }
        }

        .item {
            display: flex;
            flex-direction: row;
            align-items: center;
            margin-right: 2rem;
        }
    }


    .color {
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        margin-right: 1rem;
    }
</style>