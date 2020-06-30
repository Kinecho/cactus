<template>
    <div class="chart-container">
        <WordChart :words="words" :blurry="isBlurry"/>

        <!-- Logged out user -->
        <div class="box" v-if="!loggedIn">
            <h4>Today's Insight</h4>
            <p>To get Today's Insights,<br>signup to try Cactus.</p>
            <a class="button" :href="signupPageUrl">Try It Free</a>
        </div>

        <!-- Error state -->
        <div class="warning box" v-if="loggedIn && isRevealed && didWrite && words.length <= 0">
            <h4>Today's Insight</h4>
            <p>There was an error displaying Today's&nbsp;Insight.</p>
            <button class="primary" @click="reloadPage()">Try Again</button>
        </div>

        <!-- Basic user -->
        <div class="box" v-if="loggedIn && isBasic">
            <h4>Today's Insight</h4>
            <p>To reveal Today's Insight, upgrade to
                Cactus&nbsp;Plus.<a class="fancyLink" href="#" @click.prevent="trackRevealUrlEvent(pricingPageUrl)">Learn more</a></p>
        </div>

        <!-- Plus (Trial) user -->
        <div class="box" v-if="loggedIn && !isRevealed && !(isBasic && didWrite)">
            <h4>Today's Insight</h4>
            <p>Want to see a visualization of words that have come up recently in your&nbsp;reflections?</p>
            <button class="primary" @click="revealInsights()">Show Me!</button>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import InsightWordChart from "@components/InsightWordChart.vue"
    import {SubscriptionTier} from "@shared/models/SubscriptionProductGroup";
    import {PageRoute} from "@shared/PageRoutes";
    import {fireRevealInsightEvent, gtag} from "@web/analytics";
    import {PremiumSubscriptionTiers} from "@shared/models/MemberSubscription";
    import { InsightWord } from "@shared/api/InsightLanguageTypes";

    export default Vue.extend({
        components: {
            WordChart: InsightWordChart
        },
        created() {

        },
        props: {
            words: {type: Array as () => InsightWord[], default: []},
            startBlurred: {type: Boolean, default: false},
            subscriptionTier: {type: String as () => SubscriptionTier, default: SubscriptionTier.PLUS},
            startGated: {type: Boolean, default: false},
            didWrite: {type: Boolean, default: true},
            loggedIn: {type: Boolean, default: true}
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
                return PageRoute.PRICING + "#insights";
            },
            signupPageUrl(): string {
                return PageRoute.SIGNUP + "?message=" + encodeURIComponent("To get Today's Insights, sign up to try Cactus.")
            },
            isPlus(): boolean {
                return PremiumSubscriptionTiers.includes(this.subscriptionTier);
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
                } else if (this.words?.length <= 0) {
                    return true;
                } else if (!this.loggedIn) {
                    return true;
                }
                return false;
            }
        }, methods: {
            trackRevealEvent() {
                fireRevealInsightEvent();
            },
            trackRevealUrlEvent(url: string) {
                gtag('event', 'revealed_insight', {
                    'event_category': "prompt_content",
                    'event_label': "word_chart",
                    'transport_type': 'beacon',
                    'event_callback': function () {
                        document.location.href = url;
                    }
                });
            },
            revealInsights(): void {
                this.isRevealed = true;
                this.trackRevealEvent();
            },
            reloadPage(): void {
                window.location.reload();
            },
        }

    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";


    .chart-container {
        margin: 0;
        position: relative;
    }

    h4 {
        margin-bottom: .8rem;
        opacity: .8;
    }

    .box {
        @include shadowbox;
        background: $dolphin url(/assets/images/grainy.png);
        color: $white;
        left: 0;
        margin: auto;
        padding: 2.4rem;
        position: absolute;
        right: 0;
        top: 50%;
        transform: translateY(-50%);

        @include r(374) {
            max-width: 85%;
        }

        &.warning {
            background-image: url(/assets/images/sadCactusPatternWhiteTransparent.svg);
        }
    }

    .primary,
    a.button {
        display: inline-block;
        margin: 1.6rem auto 0;
        width: 100%;
    }

    .fancyLink {
        @include fancyLinkLight;
        display: inline-block; //to keep on one line
        margin-left: .8rem;
    }
</style>
