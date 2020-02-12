<template>
    <section class="premium">
        <div class="centered">
            <div class="tabset">
                <input type="radio" name="tabset" id="tab1" aria-controls="free" :checked="!premiumDefault">
                <label class="tab-label free-tab" for="tab1">Basic</label>
                <section id="free" class="tab-panel free-panel">
                    <p>Receive new prompts occasionally (~ once a&nbsp;week)</p>
                    <p class="price">Free forever</p>
                    <button class="secondary" disabled>Current Plan</button>
                </section>

                <input type="radio" name="tabset" id="tab2" aria-controls="premium" :checked="premiumDefault">
                <label class="tab-label premium-tab" for="tab2">Plus</label>
                <section id="premium" class="tab-panel premium-panel">
                    <p>Every day, there’s a new prompt waiting for&nbsp;you</p>
                    <div class="flexContainer">
                        <template v-for="plan in plans">
                            <div class="planButton" :id="plan.id" :aria-controls="plan.name" @click="selectPlan(plan)" :class="{selected: isSelectedPlan(plan)}">
                                <span>{{plan.name}}</span>
                                <span>${{plan.price_dollars}}</span>
                                <span>per {{plan.per}}</span>
                            </div>
                        </template>
                    </div>
                    <button v-bind:disabled="isProcessing" @click="purchaseSelectedPlan">Upgrade &mdash;
                        ${{selectedPlan.price_dollars}} / {{selectedPlan.per}}
                    </button>
                    <p class="heart">Supports Cactus development</p>
                </section>
            </div>
        </div>
    </section>
</template>

<script lang="ts">
    import Vue from "vue";
    import {Config} from "@web/config";
    import {PageRoute} from '@shared/PageRoutes';
    import {PremiumPlan} from '@shared/types/PlanTypes';
    import CactusMember from "@shared/models/CactusMember";
    import CactusMemberService from '@web/services/CactusMemberService';
    import {startCheckout} from "@web/checkoutService";
    import {ListenerUnsubscriber} from '@web/services/FirestoreService';
    import {getQueryParam} from "@web/util";
    import {QueryParam} from "@shared/util/queryParams";
    import Logger from "@shared/Logger";
    import CopyService from "@shared/copy/CopyService";

    const copy = CopyService.getSharedInstance().copy;
    const logger = new Logger("PremiumPricing");

    export default Vue.extend({
        created() {

        },
        props: {
            plans: {
                type: Array as () => PremiumPlan[],
                required: false,
                default: function () {
                    return [
                        {
                            id: Config.stripe.monthlyPlanId,
                            plan_param: 'm',
                            name: 'Monthly',
                            price_dollars: 2.99,
                            per: 'month'
                        },
                        {
                            id: Config.stripe.yearlyPlanId,
                            plan_param: 'y',
                            name: 'Annual',
                            price_dollars: 29,
                            per: 'year'
                        }
                    ]
                }
            }
        },
        data(): {
            selectedPlan: PremiumPlan | undefined,
            isProcessing: boolean,
            member: CactusMember | undefined | null,
            memberEmail: string | undefined,
            memberUnsubscriber: ListenerUnsubscriber | undefined,
            premiumDefault: boolean,
        } {
            return {
                selectedPlan: this.plans[0],
                isProcessing: false,
                member: undefined,
                memberEmail: undefined,
                memberUnsubscriber: undefined,
                premiumDefault: false,
            }
        },
        beforeMount() {
            this.memberUnsubscriber = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: ({member}) => {
                    this.member = member;

                    if (this.member?.email) {
                        this.memberEmail = this.member.email;
                    }
                }
            })

            const prem = getQueryParam(QueryParam.PREMIUM_DEFAULT);

            if (prem) {
                this.premiumDefault = true;
            }
        },
        destroyed() {

        },
        computed: {},
        watch: {},
        methods: {
            selectPlan(plan: PremiumPlan) {
                this.selectedPlan = plan;
            },
            async purchaseSelectedPlan() {
                this.isProcessing = true;
                const planId = this.selectedPlan?.id;
                const member = this.member || undefined;
                if (!member && planId) {
                    const successUrl = `${PageRoute.CHECKOUT}?${QueryParam.SUBSCRIPTION_PLAN}=${planId}`;
                    const path = `${PageRoute.SIGNUP}?${QueryParam.REDIRECT_URL}=${encodeURIComponent(successUrl)}&${QueryParam.MESSAGE}=${encodeURIComponent(copy.checkout.SIGN_IN_TO_CONTINUE_CHECKOUT)}`;
                    logger.info("User is not logged in, sending to sign in page with checkout redirect success url");
                    window.location.href = path;
                    return;
                }
                if (planId) {
                    // configureStripe('checkout-button', planId);
                    const result = await startCheckout({member, stripePlanId: planId});
                    if (!result.isRedirecting) {
                        this.isProcessing = false;
                        //TODO: add more error handling - show a message if this fails
                    }
                } else {
                    this.isProcessing = false;
                    alert('There was a problem. Please contact us at help@cactus.app.');
                }
            },
            isSelectedPlan(plan: PremiumPlan) {
                return plan == this.selectedPlan
            },
            goToSignup() {
                window.location.href = PageRoute.SIGNUP;
            }
        },

    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";
    @import "transitions";

    .premium {
        background: $beige;
        padding: 4.8rem 0;

        @include r(768) {
            padding: 9rem 2.4rem;
        }

        .centered {
            overflow: hidden;
            position: relative;

            @include r(960) {
                display: flex;
                flex-direction: row-reverse;
                justify-content: center;
                text-align: left;
            }
        }
    }

    .tabset {
        background-color: $darkestGreen;
        border-radius: 1.2rem;
        display: grid;
        grid-template-areas: "tab1 tab2" "tabpanel tabpanel";
        grid-template-columns: 50%;
        position: relative;
        text-align: left;

        @include r(374) {
            margin: 0 2.4rem;
        }

        @include r(600) {
            margin: 0 auto;
            max-width: 90%;
        }
        @include r(768) {
            background-color: transparent;
            grid-template-areas: "tabpanel1 tabpanel2";
            min-width: 67rem;
        }
        @include r(960) {
            margin: 0;
        }
    }

    /* hide the radios, show the panels */
    .tabset input[type="radio"] {
        position: absolute;
        left: -200vw;

        @include r(768) {
            display: none;
        }
    }

    .tabset .tab-panel,
    .tab-header {
        display: none;

        @include r(768) {
            display: block;
        }
    }

    .tabset > input:nth-of-type(1):checked ~ .tab-panel:nth-of-type(1),
    .tabset > input:nth-of-type(2):checked ~ .tab-panel:nth-of-type(2) {
        display: block;
    }

    .tab-label {
        background-color: darken($darkestGreen, 5%);
        cursor: pointer;
        font-size: 2rem;
        font-weight: bold;
        padding: 1.6rem;
        text-align: center;

        &:nth-of-type(1) {
            border-radius: 1.2rem 0 0 0;
        }

        &:nth-of-type(2) {
            border-radius: 0 1.2rem 0 0;
        }

        @include r(768) {
            display: none;
        }
    }

    .tabset > .tab-label:hover {
        background-color: darken($darkestGreen, 3%);
    }

    .tabset > input:focus + .tab-label,
    .tabset > input:checked + .tab-label {
        background-color: $darkestGreen;
    }

    .tab-header {
        font-size: 2.4rem;
        margin-bottom: 2.4rem;
    }

    .tab-panel {
        grid-area: tabpanel;
        padding: 2.4rem 2.4rem 3.2rem;

        @include r(768) {
            padding: 3.2rem;

            &.free-panel {
                align-self: end;
                background-color: $white;
                border-radius: 1.8rem 0 0 0;
                color: $darkestGreen;
                grid-area: tabpanel1;

                ul {
                    margin-bottom: 7.2rem;
                }
            }
            &.premium-panel {
                background-color: $darkestGreen;
                border-radius: 1.8rem 1.8rem 0 0;
                grid-area: tabpanel2;
            }
        }

        h4 {
            margin-bottom: 1.6rem;
        }

        button {
            max-width: none;
            white-space: nowrap;
            width: 100%;
        }
    }

    .heart:before {
        background-image: url(assets/icons/heart.svg);
        height: 1.5rem;
    }

    .flexContainer {
        display: flex;
        margin-bottom: 2.4rem;
        justify-content: space-between;

        .planButton {
            background-color: transparentize($white, .9);
            border: 2px solid $darkestGreen;
            border-radius: .8rem;
            cursor: pointer;
            font-size: 1.6rem;
            padding: .8rem;
            text-align: center;
            width: 49%;

            &.selected {
                border-color: $green;
                box-shadow: inset 0 0 0 .4rem $darkestGreen;
            }

            span {
                display: block;

                &:nth-child(1) {
                    font-size: 1.4rem;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                }

                &:nth-child(2) {
                    font-size: 2rem;
                }
            }
        }
    }
</style>
