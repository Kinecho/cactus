<template>
    <div>
        <section class="hero">
            <div class="centered" v-if="!coreValues">
                <h1>Get more with Cactus&nbsp;Plus</h1>
                <p class="subtext">Daily insights, core values, and&nbspmore</p>
                <a class="button btn primary" href="#upgrade">Try Cactus Plus</a>
            </div>
            <div class="centered" v-if="coreValues">
                <h1>Discover your Core&nbspValues</h1>
                <p class="subtext">Cactus Plus members get core values, daily insights, and&nbsp;more</p>
                <a class="button btn primary" href="#upgrade">Try Cactus Plus</a>
            </div>
        </section>
        <div class="middleSections">
            <section class="benefits">
                <div class="centered">
                    <div>
                        <h2 class="sectionHeader">Expand your mindfulness&nbsp;journey</h2>
                        <div class="flexContainer">
                            <div class="benefit">
                                <span class="benefitIcon"><img src="/assets/images/pie.svg" alt=""/></span>
                                <h3>Daily insights</h3>
                                <p class="text">Cactus will visualize your journey, revealing important insights about
                                    you, to&nbsp;you.</p>
                            </div>
                            <div class="benefit">
                                <span class="benefitIcon"><img src="/assets/images/checkCircle.svg" alt=""/></span>
                                <h3>Core values</h3>
                                <p class="text">Cactus will help identify your core values and use them to provide a
                                    personalized mindfulness&nbsp;journey.</p>
                            </div>
                            <div class="benefit">
                                <span class="benefitIcon"><img src="/assets/icons/lock.svg" alt=""/></span>
                                <h3>Private + secure</h3>
                                <p class="text">Your journal entries are yours—encrypted and never read
                                    or&nbsp;sold.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section class="insights feature">
                <div class="centered reverse" id="insights">
                    <div class="sectionGraphic">
                        <img class="" src="/assets/images/insights.svg" alt="insights graphic"/>
                    </div>
                    <div class="textContainer">
                        <h4>New</h4>
                        <h3>Personal Insights</h3>
                        <p>Cactus will visualize your journey, revealing important insights about you, to you, like what
                            you spend the most time reflecting on, what words come up often in your reflections, and&nbsp;more.</p>
                    </div>
                </div>
            </section>
            <section class="coreValues feature">
                <div class="centered" id="coreValues">
                    <div class="sectionGraphic">
                        <img class="" src="/assets/images/coreValues.svg" alt="core values graphic"/>
                    </div>
                    <div class="textContainer">
                        <h4>New</h4>
                        <h3>Core Values Assessment</h3>
                        <p>Is loyalty or honesty more important to you? Knowing your core values is critical in making
                            decisions for your happiness. Cactus will use your core values to provide a personalized
                            mindfulness&nbsp;journey.</p>
                    </div>
                </div>
            </section>
        </div>
        <section class="upgrade">
            <div class="centered" id="upgrade">
                <h2 class="sectionHeader">Choose your plan:</h2>
                <PremiumPricing
                        :checkout-cancel-url="checkoutCancelUrl"
                        :checkout-success-url="checkoutSuccessUrl"
                />
            </div>
        </section>
        <StandardFooter/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue"
    import StandardFooter from "@components/StandardFooter.vue";
    import NavBar from "@components/NavBar.vue";
    import PremiumPricing from "@components/PremiumPricing.vue";
    import { getQueryParam } from "@web/util";
    import { QueryParam } from "@shared/util/queryParams"
    import SnackbarContent from "@components/SnackbarContent.vue";
    import { PageRoute } from "@shared/PageRoutes";
    import { appendQueryParams } from "@shared/util/StringUtil";

    export default Vue.extend({
        components: {
            StandardFooter,
            NavBar,
            PremiumPricing,
            SnackbarContent
        },
        data(): {
            coreValues: boolean,
        } {
            return {
                coreValues: false,
            }
        },
        created() {
            this.coreValues = getQueryParam(QueryParam.CORE_VALUES) == "true" || false;
        },
        computed: {
            checkoutSuccessUrl(): string | undefined {
                return appendQueryParams(PageRoute.MEMBER_HOME, { [QueryParam.UPGRADE_SUCCESS]: "success" });
            },
            checkoutCancelUrl(): string | undefined {
                return PageRoute.PRICING;
            }
        }
    });
</script>

<style scoped lang="scss">
    @import "common";
    @import "mixins";
    @import "transitions";
    @import "pages/pricing";

    .top-message {
        border-radius: 0;
        display: block;
        padding: 3.2rem 2.4rem;
        margin-bottom: 0;

        .centered {
            max-width: 64rem;
        }

        p {
            opacity: .9;
        }

        a {
            @include fancyLinkLight;
        }
    }
</style>
