<template>
    <div class="insight-word-chart">
        <div :class="['bubble-chart',{hasAccess: hasAccess}]" />
        <div class="upgrade" v-if="!hasAccess">
            <p>To reveal Today's Insight,<br>upgrade to Cactus Plus.</p>
            <a class="button primary" :href="pricingPageUrl">Learn More</a>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {InsightWord} from '@shared/models/ReflectionResponse'
    import {
        pack as d3Pack,
        scaleOrdinal as d3ScaleOrdinal,
        format as d3Format,
        hierarchy as d3Hierarchy,
        select as d3Select
    } from "d3";
    import {PageRoute} from '@shared/PageRoutes'

    export default Vue.extend({
        mounted() {
            this.renderBubbles();
        },
        watch: {
            words() {
                this.renderBubbles();
            }
        },
        props: {
            words: Array,
            hasAccess: {type: Boolean, default: true}
        },
        computed: {
            pricingPageUrl(): string {
                return PageRoute.PAYMENT_PLANS;
            }
        },
        methods: {
            renderBubbles(): void {
                var diameter = 375, //max size of the bubbles
                    format   = d3Format(",d"),
                    color    = d3ScaleOrdinal()
                               //@ts-ignore
                               .range(["#F2EBE9","#F2EBE9","#F2EBE9","#9C1AA3","#364FAC","#47445E"].reverse())
                    //more color options: https://github.com/d3/d3-scale-chromatic

                var bubble = d3Pack()
                    .size([diameter, diameter])
                    .padding(12);

                var svg = d3Select(".bubble-chart")
                    .append("svg")
                    .attr("width", "100%")
                    .attr("height", "100%")
                    .attr("preserveAspectRatio", "xMinYMid")
                    .attr("viewBox", "0 0 375 375")

                if (this.words) {
                    const extras: InsightWord[] = [
                        {word: "", frequency: .5},
                        {word: "", frequency: .5},
                        {word: "", frequency: .3},
                        {word: "", frequency: .3},
                        {word: "", frequency: .3},
                        {word: "", frequency: .1},
                        {word: "", frequency: .1},
                        {word: "", frequency: .1},
                        {word: "", frequency: .1},
                        {word: "", frequency: .1},
                    ];
                    var dataset = this.words.slice(0,7).concat(extras);

                    //convert numerical values from strings to numbers
                    // @ts-ignore
                    var data = dataset.map(function(d){ d.value = +d["frequency"]; return d; });

                    //Sets up a hierarchy of data object
                    var root = d3Hierarchy({children:data})
                    // @ts-ignore
                      .sum(function(d) { return d.value; })
                    // @ts-ignore
                      .sort(function(a, b) { return b.value - a.value; });

                    //Once we have hierarchal data, run bubble generator
                    bubble(root);

                    //setup the chart
                    var bubbles = svg.selectAll(".bubble")
                    // @ts-ignore
                        .data(root.children)
                        .enter();

                    //create the bubbles
                    bubbles.append("circle")
                        .attr("class", "circle")
                    // @ts-ignore
                        .attr("r", function(d){ return d.r; })
                    // @ts-ignore
                        .attr("cx", function(d){ return d.x; })
                    // @ts-ignore
                        .attr("cy", function(d){ return d.y; })
                    // @ts-ignore
                        .style("fill", function(d) { return color(d.value); });

                    //format the text for each bubble
                    bubbles.append("text")
                    // @ts-ignore
                        .attr("x", function(d){ return d.x; })
                    // @ts-ignore
                        .attr("y", function(d){ return d.y + 5; })
                        .attr("text-anchor", "middle")
                        .attr("dominant-baseline", "middle")
                    // @ts-ignore
                        .text(function(d){ return d.data["word"]; })
                    // @ts-ignore
                        .style("font-size", function(d) { return Math.min(2 * d.r, (2 * d.r - 8) / this.getComputedTextLength() * 14) + "px"; })
                        .style("fill", "#FFF")
                        .append("title")
                        // @ts-ignore
                        .text(function(d, i) { return d.data["word"]; });
                }
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .insight-word-chart {
        position: relative;
    }
    .upgrade {
        padding: 2rem;
        background: $darkestGreen;
        color: $white;
        border-radius: 12px;
        top: 100px;
        width: 100%;
        position: absolute;
        a {
            display: inline-block;
            margin: 2rem auto 0;
        }
    }

    .bubble-chart {
        filter: blur(4px);
        opacity: .8;

        &.hasAccess {
            filter: none;
            opacity: 1;
        }
    }
</style>
