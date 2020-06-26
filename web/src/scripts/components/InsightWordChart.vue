<template>
    <div class="insight-word-chart">
        <div :class="['bubble-chart', {isBlurry: blurry}]"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Logger from "@shared/Logger";
    import Component from "vue-class-component";
    import { Prop, Watch } from "vue-property-decorator";
    import { drawWordBubbleChart, WordBubbleConfig } from "@web/charts/wordBubbles";
    import { InsightWord } from "@shared/api/InsightLanguageTypes";

    const logger = new Logger("InsightWordChart");

    @Component
    export default class InsightWordChart extends Vue {
        isMounted = false;

        mounted() {
            this.isMounted = true;
            this.renderBubbles();
        }

        @Watch("words")
        onWords() {
            this.renderBubbles();
        }

        selected: InsightWord | null = null;

        @Prop({ type: Array as () => InsightWord[], default: [] })
        words!: InsightWord[];

        @Prop({ type: Boolean, default: false })
        selectable!: boolean;

        @Prop({ type: Boolean, default: false })
        blurry!: boolean;

        @Prop({ type: Object as () => WordBubbleConfig, required: false, default: null })
        chartConfig!: WordBubbleConfig | null

        renderBubbles() {
            if (!this.isMounted) {
                logger.info("Not mounted yet");
                return;
            }
            this.$forceUpdate();
            const parentSelector = ".bubble-chart";
            drawWordBubbleChart(parentSelector, this.words, {
                selectable: this.selectable,
                ...this.chartConfig,
                wordClicked: (word, selected) => {
                    logger.info("Clicked ", word);
                    this.selected = selected ? word : null;
                    this.$emit("selected", selected ? word : null);
                }
            })
        }
    }
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .insight-word-chart {
        margin: 0;
        position: relative;
    }

    .bubble-chart {
        margin: 0 auto 1.6rem;
        max-width: 40rem;
        transition: 1s ease-in-out;

        &.isBlurry {
            filter: blur(11px);
            opacity: .8;
        }
    }
</style>
