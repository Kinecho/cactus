<template>
    <div class="container">
        <h2>Change Your Plan</h2>
        <p>To change your plan, please send us an email to <a :href="`mailto:help@cactus.app?subject=${subject}`">help@cactus.app</a>. You&nbsp;can view your options on the <a :href="pricingRoute" target="_blank">{{commonCopy.PRICING}}</a>&nbsp;page. All&nbsp;requests are processed within 24&nbsp;hours.</p>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import CopyService from "@shared/copy/CopyService";
    import {CommonCopy} from '@shared/copy/CopyTypes';
    import CactusMember from "@shared/models/CactusMember";
    import CactusMemberService from "@web/services/CactusMemberService";
    import {PageRoute} from '@shared/PageRoutes';

    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
        created() {

        },
        props: {
            member: Object as () => CactusMember,
        },
        data(): {
            pricingRoute: string,
            commonCopy: CommonCopy,
        } {
            return {
                pricingRoute: PageRoute.PRICING,
                commonCopy: copy.common,
            }
        },
        computed: {
            subject(): string {
                const member = this.member || CactusMemberService.sharedInstance.currentMember;
                return encodeURIComponent(`Change Plan for ${member.email} (${member.id})`)
            },
            body(): string {
                const member = this.member || CactusMemberService.sharedInstance.currentMember;
                return encodeURIComponent(`Hi,\n\nI'd like to cancel my Cactus ${member?.tierDisplayName} subscription.\n\nThe email address on my account is ${member.email} and my member ID is ${member.id}.\n\nThanks,\n${member.getFullName()}`.trim())
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .container {
        @include shadowbox();
        background: $royal url(assets/images/plusBg.svg) center top/135% auto no-repeat;
        color: $white;
        margin: 2.4rem;
        max-width: 58rem;
        padding: 2.4rem 3.2rem;

        @include r(600) {
            margin: 0;
        }
        @include r(768) {
            background-size: 105% auto;
            max-width: 64rem;
            padding: 4.8rem;
        }

        h2 {
            border-radius: 1.2rem 1.2rem 0 0;
            margin-bottom: .8rem;

            @include r(768) {
                margin-bottom: 0;
            }
        }

        p {
            opacity: .9;
        }

        a {
            color: $white;
        }
    }
</style>
