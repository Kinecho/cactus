import {SubscriptionTier} from '@shared/models/SubscriptionProductGroup'
<template>
    <div v-if="member.hasActiveSubscription">
        <h4 class="tier">{{tierName}}</h4>
        <p>Your next bill is for XX on XX/XX/XXXX</p>

        <button @click="downgrade" class="button secondary small">Downgrade to {{basicTierName}}</button>

        <modal :show="showDowngradeModal" :show-close-button="true" @close="showDowngradeModal=false">
            <downgrade-form slot="body" :member="member"/>
        </modal>

    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import CactusMember from "@shared/models/CactusMember";
    import {subscriptionTierDisplayName} from "@shared/models/MemberSubscription";
    import Modal from "@components/Modal.vue";
    import DowngradeSubscriptionForm from "@components/DowngradeSubscriptionForm.vue";
    import {SubscriptionTier} from "@shared/models/SubscriptionProductGroup";

    export default Vue.extend({
        components: {
          Modal,
          DowngradeForm: DowngradeSubscriptionForm,
        },
        props: {
            member: {type: Object as () => CactusMember, required: true}
        },
        data(): {
            showDowngradeModal: boolean,
        } {
            return {showDowngradeModal: false}
        },
        computed: {
            tierName(): string | undefined {
                return subscriptionTierDisplayName(this.member.tier)
            },
            basicTierName(): string {
                return subscriptionTierDisplayName(SubscriptionTier.BASIC)!
            }
        }, methods: {
            async downgrade() {
                this.showDowngradeModal = true;
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";


</style>
