<template>
    <div class="insight-word-chart">
        <div :class="['bubble-chart',{isBlurry: isBlurry}]"/>
        <div class="upgradeBox" v-if="isRevealed && isBasic">
            <p>To reveal Today's&nbsp;Insight,<br>upgrade to Cactus&nbsp;Plus.</p>
            <a :href="pricingPageUrl">Learn More</a>
        </div>
        <div class="revealBox" v-if="!isRevealed">
            <p>Want to see Today’s Insight?</p>
            <button class="primary" @click="revealInsights()">Show Me!</button>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {InsightWord} from '@shared/models/ReflectionResponse'
    import {SubscriptionTier} from '@shared/models/SubscriptionProductGroup'
    import {
        pack as d3Pack,
        scaleOrdinal as d3ScaleOrdinal,
        format as d3Format,
        hierarchy as d3Hierarchy,
        select as d3Select
    } from "d3";
    import {PageRoute} from '@shared/PageRoutes'
    import Logger from "@shared/Logger";
    import {HierarchyCircularNode} from "d3-hierarchy";
    import {gtag} from "@web/analytics"

    interface InsightDataValue extends InsightWord {
        value: number
    }

    const logger = new Logger("InsightWordChart");

    type Datum = { children: InsightWord[] };
    type BubbleNode = Datum | InsightWord;

    function isInsightWord(d: BubbleNode): d is InsightWord {
        return !(d as Datum).children && (d as InsightWord).word != undefined
    }

    function isDatum(d: BubbleNode): d is Datum {
        return !!(d as Datum).children
    }


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
            words: {type: Array as () => InsightWord[], default: [{word: "", frequency: 3}]},
            startBlurred: {type: Boolean, default: false},
            subscriptionTier: {type: String as () => SubscriptionTier, default: SubscriptionTier.PLUS},
            startGated: {type: Boolean, default: false}
        },
        data(): {
            isRevealed: boolean    
        } {
            return {
                isRevealed: !this.startGated
            }
        },
        computed: {
            pricingPageUrl(): string {
                return PageRoute.PAYMENT_PLANS;
            },
            isPlus(): boolean {
                return this.subscriptionTier === SubscriptionTier.PLUS
            },
            isBasic(): boolean {
                return this.subscriptionTier === SubscriptionTier.BASIC
            },
            isBlurry(): boolean {
                if (this.isBasic) { // never not blurry if basic
                    return true;
                } else if (this.startGated && !this.isRevealed) {
                    return true;
                } else if (!this.startGated && this.startBlurred) {
                    return true;
                }
                return false;
            }
        },
        methods: {
            trackRevealEvent() {
                gtag('event', 'revealed_insight', {
                    event_category: "prompt_content",
                    event_label: "word_chart"
                });
            },
            revealInsights(): void {
                this.isRevealed = true;
                this.trackRevealEvent();
            },
            renderBubbles(): void {
                this.$forceUpdate();

                const maxDiameter = 375; //max size of the bubbles
                const format = d3Format(",d");

                //more color options: https://github.com/d3/d3-scale-chromatic
                let colorRange: string[] = [
                    "#47445E",
                    "#364FAC",
                    "#9C1AA3",
                    "#D9D3D0",
                    "#D9D3D0",
                    "#D9D3D0"
                ];

                const color = d3ScaleOrdinal()
                    //@ts-ignore - ignore because this range does accept strings but typescript doesn't know that.
                    .range(colorRange);

                let bubble = d3Pack()
                    .size([maxDiameter, maxDiameter])
                    .padding(12);

                d3Select(".bubble-chart svg").remove();

                let svg = d3Select(".bubble-chart")
                    .append("svg")
                    .attr("width", "100%")
                    .attr("height", "100%")
                    .attr("preserveAspectRatio", "xMinYMid")
                    .attr("viewBox", "0 0 375 375");

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
                    let dataset = this.words.slice(0, 7).concat(extras);
                    logger.info("dataset", dataset);

                    //Sets up a hierarchy of data object
                    let root = d3Hierarchy({children: dataset})
                        .sum((d: BubbleNode) => {
                            let t = 0;
                            if (isInsightWord(d)) {
                                t = d.frequency ?? 0
                            }
                            return t;

                        })
                        .sort((a, b) => {
                            return (b.value ?? 0) - (a.value ?? 0);
                        }) as HierarchyCircularNode<BubbleNode>;

                    //Once we have hierarchal data, run bubble generator
                    bubble(root);

                    //setup the chart
                    let bubbles = svg.selectAll(".bubble")
                        .data(root.children!)
                        .enter();

                    //create the bubbles
                    bubbles.append("circle")
                        .attr("class", "circle")
                        .attr("r", (d) => {
                            return d.r;
                        })
                        .attr("cx", (d) => {
                            return d.x;
                        })
                        .attr("cy", (d) => {
                            return d.y;
                        })
                        .style("fill", (d) => {
                            let fillColor = color(`${d.value ?? 0}`);
                            return fillColor as string;
                        });

                    //format the text for each bubble
                    bubbles.append("text")
                        .attr("x", (d) => {
                            return d.x;
                        })
                        .attr("y", (d) => {
                            return d.y + 5;
                        })
                        .attr("text-anchor", "middle")
                        .attr("dominant-baseline", "middle")
                        .text((d) => {
                            if (isInsightWord(d.data)) {
                                return d.data.word
                            }
                            return " "
                        })
                        // Note: This one needs to have the anonymous function
                        // syntax because we need the "this" context that gets lost with the arrow syntax
                        .style("font-size", function (d) {
                            return Math.min(2 * d.r, (2 * d.r - 8) / this.getComputedTextLength() * 14) + "px";
                        })
                        .style("fill", "#FFF")
                        .append("title")
                        .text(d => {
                            if (isInsightWord(d.data)) {
                                return d.data.word
                            }
                            return " "
                        });
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

    .upgradeBox, .revealBox {
        @include shadowbox;
        background: $dolphin url(assets/images/grainy.png);
        color: $white;
        left: 0;
        margin: auto;
        padding: 2.4rem;
        position: absolute;
        right: 0;
        top: 50%;
        transform: translateY(-50%);

        @include r(374) {
            max-width: 75%;
        }

        button, a {
            display: inline-block;
            margin: 1.6rem auto 0;
        }
    }

    .upgradeBox {
        background: $white;
        color: $darkText;
    }

    .bubble-chart {
        margin: 0 auto;
        /*max-width: 350px;*/

        -webkit-transition: 1s ease-in-out;
        transition: 1s ease-in-out;

        &.isBlurry {
            opacity: .8;
            filter: blur(11px);
        }
    }
</style>
