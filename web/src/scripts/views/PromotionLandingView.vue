<template>
    <div>
        <spinner v-if="loading">Loading....</spinner>
        <template v-if="!loading">
            <p>
                <strong>Slug:</strong> "{{slug}}"
            </p>
            <div v-if="offer">
                <strong>Found Promotions:</strong>
                <div v-if="offer">
                    <p>Offer ID: {{offer.entryId}}</p>
                    <p>Offer Name: {{offer.displayName}}</p>
                    <p>Offer Slug: {{offer.urlSlug}}</p>
                </div>
            </div>
            <p v-else>
                No offer found
            </p>
        </template>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import PromotionalOffer from "@shared/models/PromotionalOffer";
    import { Prop, Watch } from "vue-property-decorator";
    import Spinner from "@components/Spinner.vue";
    import PromotionalOfferService from "@web/services/PromotionalOfferService";
    import { pushRoute } from "@web/NavigationUtil";
    import { PageRoute } from "@shared/PageRoutes";
    import { isBlank } from "@shared/util/StringUtil";
    import PromotionalOfferManager from "@web/managers/PromotionalOfferManager";
    import Logger from "@shared/Logger"

    const logger = new Logger("PromotionLandingView");

    @Component({
        components: {
            Spinner
        }
    })
    export default class PromotionLandingView extends Vue {
        name = "PromotionLandingView";

        @Prop({ type: String, required: true })
        slug!: string;

        offer: PromotionalOffer | null = null;
        loading = false;

        @Watch("slug")
        onSlug(slug: string, previous?: string) {
            if (slug !== previous) {
                this.fetchOffer();
            }
        }

        beforeMount() {
            this.fetchOffer()
        }

        async fetchOffer() {
            const slug = this.slug;
            this.loading = true;
            const offer = await PromotionalOfferService.shared.getBySlug(slug);
            if (offer) {
                logger.debug("applying offer", offer.displayName)
                await PromotionalOfferManager.shared.applyOffer(offer);
            }

            this.offer = offer;
            this.loading = false;
            const url = this.offer?.continueUrl;
            if (!isBlank(url)) {
                await pushRoute(url);
            } else {
                await pushRoute(PageRoute.HOME);
            }
        }
    }
</script>

<style scoped lang="scss">

</style>