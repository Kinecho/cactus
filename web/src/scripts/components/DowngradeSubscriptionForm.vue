<template>
    <div class="container">
        <h2>You've downgraded to Basic.</h2>
        <p>In the future, Cactus will not charge your payment method again. If you have questions or feedback, we'd love to hear from you.</p>
        <div class="actions">
            <a :href="`mailto:help@cactus.appp?subject=${subject}&body=${body}`" class="button primary" target="_blank">Send Email</a>
        </div>

    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import CopyService from "@shared/copy/CopyService";
    import CactusMember from "@shared/models/CactusMember";
    import CactusMemberService from "@web/services/CactusMemberService";

    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
        created() {

        },
        props: {
            member: Object as () => CactusMember,
        },
        data(): {} {
            return {}
        }, computed: {
            subject(): string {
                const member = this.member || CactusMemberService.sharedInstance.currentMember;
                return encodeURIComponent(`Cancel Subscription for ${member.email} (${member.id})`)
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
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 35rem;
        padding: 4rem;
        background-color: $darkestGreen;
        color: white;
        max-width: 65rem;
        text-align: center;

        .actions {
            margin-top: 3rem;
        }
    }
</style>
