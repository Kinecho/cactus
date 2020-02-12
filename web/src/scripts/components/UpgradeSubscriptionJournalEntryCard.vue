<template>
    <div class="upgrade-wrapper">
        <div class="upgrade-card">
            <div class="upgrade trial" v-if="isTrialing">
                <h3>{{trialDaysLeftHeader}}</h3>
                <p>After your trial of Cactus Plus, new prompts will only occasionally be sent. Give your reflection practice momentum by receiving a fresh prompt, every day.</p>
                <div class="actions">
                    <a :href="upgradeRoute" class="btn button primary">Go Plus</a>
                </div>
            </div>
            <div class="upgrade basic" v-else>
                <h3>Cactus Plus</h3>
                <p>Give your reflection practice momentum by receiving a fresh prompt, every day.</p>
                <div class="actions">
                    <a :href="upgradeRoute" class="btn button primary">{{basicCTA}}</a>
                </div>
            </div>
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
                    if (days === 0) {
                        return 'Your trial has ended';
                    } else if (days === 1) {
                        return 'Your trial ends today';
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

    .upgrade-card {
        @include shadowbox;
        padding: 4rem;
        background: #2c3c94 url(/assets/images/premiumBG.png) no-repeat;
        color: $white;
        text-align: left;
        max-width: 64rem;
        margin: 0 auto;
        .actions {
            margin-top: 2rem;
        }
    }

    .upgrade-wrapper {
        margin-bottom: 3rem;
    }

</style>

