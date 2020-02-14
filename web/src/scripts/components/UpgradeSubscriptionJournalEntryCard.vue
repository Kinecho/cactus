<template>
    <div :class="[`upgradeJournal`, isTrialing ? 'upgrade' : 'basic']">
        <div class="centered" v-if="isTrialing">
            <h3>{{trialDaysLeftHeader}}</h3>
            <p>After your trial of Cactus Plus, new prompts will only occasionally be sent. Give your reflection practice momentum by receiving a fresh prompt, every day.</p>
            <a :href="upgradeRoute" class="btn button primary">Go Plus</a>
        </div>
        <div class="centered" v-else>
            <h3>Cactus Plus</h3>
            <p>Give your reflection practice momentum by receiving a fresh prompt, every day.</p>
            <a :href="upgradeRoute" class="btn button primary">{{basicCTA}}</a>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {PageRoute} from "@shared/PageRoutes";
    import CactusMember from '@shared/models/CactusMember';

    export default Vue.extend({
        created() {

        },
        props: {
            member: { type: CactusMember },
            hasPromptToday: { type: Boolean }
        },
        data(): {
            upgradeRoute: string
        } {
            return {
                upgradeRoute: PageRoute.PAYMENT_PLANS
            }
        },
        computed: {
            isTrialing(): boolean {
                return this.member?.isInTrial;
            },
            trialDaysLeftHeader(): string {
                if (this.member?.daysLeftInTrial) {
                    const days = this.member?.daysLeftInTrial;
                    if (days === 1) {
                        return 'Trial ends today';
                    } else {
                        return days + ' days left';
                    }
                }
                return '';
            },
            basicCTA(): string {
                if (this.hasPromptToday) {
                    return "Go Plus";
                } else {
                    return "Get Today's Prompt";
                }
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .upgradeJournal {
        color: $white;
        padding: 1.6rem 2.4rem;
        position: relative;

        .centered {
            max-width: 58rem;
            text-align: left;
        }

        &.upgrade {
            background: $royal url(assets/images/plusBg.svg) center top/140vw auto no-repeat;

            @include r(960) {
                background-size: 97% auto;
            }



            p {
                font-size: 1.8rem;
            }
        }

        &.basic {
            background: $royal url(assets/images/plusBg.svg) center top/130% auto no-repeat;
            width: 100%;

            @include r(960) {
                background-size: 90% auto;
                padding: .8rem;
                text-align: center;

                .centered {
                    max-width: none;
                    text-align: center;
                }

                h3, p {
                    display: inline;
                    font-size: 1.8rem;
                    margin-right: 1.6rem;
                }

                a.button {
                    box-shadow: none;
                    font-size: 1.6rem;
                    margin-bottom: 0;
                    padding: 1.2rem 1.6rem;
                }
            }
        }

        h3 {
            font-size: 2rem;
            margin-bottom: .4rem;
        }

        p {
            font-size: 1.6rem;
            margin-bottom: 1.6rem;
        }

        a.button {
            display: inline-block;
            margin-bottom: .8rem;
            min-width: 16rem;
        }
    }

</style>
