<template>
    <div class="main">
        <onboarding :index="index"
                v-if="!!settings"
                :cards="cards"
                :product="product"
                :page-status="pageStatus"
                :member="member"
                @index="setIndex"
        />
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import Onboarding from "@components/onboarding/Onboarding.vue";
    import { Prop } from "vue-property-decorator";
    import { pushRoute } from "@web/NavigationUtil";
    import { PageRoute } from "@shared/PageRoutes";
    import SubscriptionProductService from "@web/services/SubscriptionProductService";
    import SubscriptionProduct, { BillingPeriod } from "@shared/models/SubscriptionProduct";
    import Logger from "@shared/Logger"
    import { PageStatus } from "@components/onboarding/OnboardingTypes";
    import CactusMember from "@shared/models/CactusMember";
    import { isNumber } from "@shared/util/ObjectUtil";
    import OnboardingCardViewModel, { CardType } from "@components/onboarding/OnboardingCardViewModel";
    import { isPremiumTier } from "@shared/models/MemberSubscription";
    import AppSettingsService from "@web/services/AppSettingsService";
    import AppSettings from "@shared/models/AppSettings";

    const logger = new Logger("OnboardingPage");

    const BASE_PATH = PageRoute.HELLO_CORE_VALUES;

    @Component({
        components: { Onboarding }
    })
    export default class MagicCoreValuesOnboarding extends Vue {
        name = "MagicCoreValuesOnboarding";

        @Prop({ type: String as () => PageStatus, required: false, default: null })
        pageStatus!: PageStatus | null;

        @Prop({ type: Object as () => CactusMember, required: true })
        member!: CactusMember;

        @Prop({ type: String, required: false, default: null })
        slug!: string | null;

        product: SubscriptionProduct | null = null;
        billingPeriod = BillingPeriod.yearly;
        productLoaded = false;
        settings: AppSettings | null = null;

        async beforeMount() {
            await this.fetchProduct();
            this.settings = await AppSettingsService.sharedInstance.getCurrentSettings() ?? null;
        }

        async setIndex(index: number) {
            if (index === 0) {
                await pushRoute(BASE_PATH);
                return
            }
            let card = this.cards[index];
            const slug = card?.slug ?? (index + 1);
            await pushRoute(`${ BASE_PATH }/${ slug }`);
        }

        get index(): number {
            if (!this.slug) {
                return 0;
            }
            try {
                let pageNumber = Number(this.slug);
                if (isNumber(pageNumber) && !isNaN(pageNumber)) {
                    return Math.max(pageNumber - 1, 0);
                }
            } catch (error) {
                //no op
            }
            return Math.max(this.cards.findIndex(card => card.slug === this.slug), 0);
        }

        get cards(): OnboardingCardViewModel[] {
            let cards = OnboardingCardViewModel.createCoreValuesCards(this.settings);
            if (isPremiumTier(this.member.tier) && this.pageStatus !== PageStatus.success) {
                cards = cards.filter(card => card.type !== CardType.upsell)
            }

            return cards;
        }

        async fetchProduct() {
            this.productLoaded = false;
            this.product = await SubscriptionProductService.sharedInstance.getByBillingPeriod(this.billingPeriod) ?? null;
            logger.info("Fetched subscription product for billing period: ", this.billingPeriod, this.product);
            this.$emit('product', this.product);
            this.productLoaded = true;
        }
    }
</script>

<style scoped lang="scss">
    @import "variables";

</style>