<template>
    <modal :show="showModal"
            v-on:close="$emit('close')"
            :showCloseButton="true"
            :tall="true"
    >
        <div slot="body" class="miniModal">
            <div class="miniHero">
                <h2>Try Cactus&nbsp;Plus, free for 7 days</h2>
                <p class="subtext">You'll get access to these popular features:</p>
            </div>
            <div class="benefit">
                <span class="benefitIcon"><img src="/assets/images/checkCircle.svg" alt=""/></span>
                <div>
                    <h3>Core Values Assessment</h3>
                    <p class="text">Make better decisions by prioritizing what's important to you.</p>
                </div>
            </div>
            <div class="benefit">
                <span class="benefitIcon"><img src="/assets/images/pie.svg" alt=""/></span>
                <div>
                    <h3>Personal Insights</h3>
                    <p class="text">Visualizations reveal the people, places, and things that contribute to your&nbsp;satisfaction.</p>
                </div>
            </div>
            <div class="pricingWrapper">
                <PremiumPricing
                        :showFooter="false"
                        :startTrial="true"
                        promotion-name="Pricing Modal"
                        :checkout-cancel-url="checkoutCancelUrl"
                        :checkout-success-url="checkoutSuccessUrl"
                />
            </div>
        </div>
    </modal>
</template>

<script lang="ts">
    import Vue from "vue"
    import PremiumPricing from "@components/PremiumPricing.vue";
    import Modal from "@components/Modal.vue";
    import { appendQueryParams } from "@shared/util/StringUtil";
    import { PageRoute } from "@shared/PageRoutes";
    import { QueryParam } from "@shared/util/queryParams";

    export default Vue.extend({
        components: {
            PremiumPricing,
            Modal,
        },
        props: {
            showModal: { type: Boolean, default: false },
        },
        data(): {} {
            return {}
        },
        computed: {
            checkoutSuccessUrl(): string | undefined {
                return appendQueryParams(PageRoute.MEMBER_HOME, { [QueryParam.UPGRADE_SUCCESS]: "success" });
            },
            checkoutCancelUrl(): string | undefined {
                return window.location.href;
            }
        }
    });
</script>

<style scoped lang="scss">
    @import "~styles/common";
    @import "~styles/mixins";
    @import "~styles/transitions";
    @import "~styles/pages/pricing";

    .miniModal {
        background: $beige no-repeat;
        background-image: url(/assets/images/beigeBlob.svg), url(/assets/images/blob-outline-beige.svg);
        background-position: right -185px top -65px, right -55px top -175px;
        background-size: 394px;
        margin: 0 auto;
        min-height: 100vh;
        text-align: center;

        @include r(600) {
            @include shadowbox;
            background-color: $beige;
            max-width: 64rem;
            min-height: 0;
        }

        .subtext {
            font-size: 1.6rem;
            margin: 0 auto;
            max-width: 64rem;

            @include r(600) {
                font-size: 1.8rem;
            }
        }

        .benefit {
            display: flex;
            margin: 0 0 1.6rem;
            max-width: none;
            padding: 0 1.6rem;
            text-align: left;

            @include r(374) {
                padding: 0 2.4rem;
            }
            @include r(600) {
                padding: 0 3.2rem;
            }

            p {
                font-size: 1.6rem;

                @include r(600) {
                    font-size: 1.8rem;
                }
            }
        }

        h3 {
            font-size: 1.8rem;
            margin-bottom: 0;

            @include r(600) {
                font-size: 2.1rem;
            }
        }

        .benefitIcon {
            background-color: transparent;
            flex-shrink: 0;
            height: 3rem;
            margin: .3rem 1.2rem 0 0;
            width: 3rem;
        }
    }

    .miniHero {
        padding: 1.6rem 4rem 3.2rem;

        @include r(374) {
            padding: 2.4rem 4rem 3.2rem;
        }
        @include r(600) {
            padding: 3.2rem;
        }

        h2 {
            line-height: 1.2;
            margin-bottom: .4rem;

            @include r(600) {
                font-size: 3.2rem;
            }
        }
    }

    .pricingWrapper {
        background: $dolphin url(/assets/images/grainy.png) repeat;
        margin-top: 3.2rem;

        @include r(600) {
            border-radius: 0 0 1.2rem 1.2rem;
        }
        @include r(768) {
            padding: 0 8rem;
        }
    }
</style>
