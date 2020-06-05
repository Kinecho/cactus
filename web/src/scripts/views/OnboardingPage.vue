<template>
    <div class="main">
        <onboarding :index="page - 1"
                @index="setIndex"
                :product="product"
                :page-status="pageStatus"
                :member="member"
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

    const logger = new Logger("OnboardingPage");

    @Component({
        components: { Onboarding }
    })
    export default class OnboardingPage extends Vue {
        name = "OnboardingPage";

        @Prop({ type: Number, required: false, default: 1 })
        page: number;

        @Prop({ type: String as () => PageStatus, required: false, default: null })
        pageStatus: PageStatus | null;

        @Prop({ type: Object as () => CactusMember, required: true })
        member!: CactusMember;

        product: SubscriptionProduct | null = null;
        billingPeriod = BillingPeriod.yearly;
        productLoaded = false;

        beforeMount() {
            this.fetchProduct();
        }

        async setIndex(index: number) {
            if (index === 0) {
                await pushRoute(PageRoute.ONBOARDING);
                return
            }
            await pushRoute(`${ PageRoute.ONBOARDING }/${ index + 1 }`);
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