<template>
    <div class="actionButton" v-if="isVisible">
        <component
                :is="attributes.type"
                :class="classNames"
                v-bind="attributes.props"
                @click="handleClick">{{attributes.label}}
        </component>
        <pricing-modal :show-modal="showPricingModal" @close="showPricingModal = false"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import Logger from "@shared/Logger"
    import { ActionButton, ContentAction, ContentLink, LinkStyle, LinkTarget } from "@shared/models/PromptContent";
    import { Prop } from "vue-property-decorator";
    import { PageRoute } from "@shared/PageRoutes";
    import { appendQueryParams, isBlank, isExternalUrl } from "@shared/util/StringUtil";
    import PricingModal from "@components/PricingModal.vue";
    import { QueryParam } from "@shared/util/queryParams";
    import CactusMemberService from "@web/services/CactusMemberService";

    const logger = new Logger("PromptButton");

    interface Attributes {
        type: string,
        props: any,
        label?: string,
    }

    @Component({
        components: {
            PricingModal,
        }
    })
    export default class PromptButton extends Vue {
        name = "PromptButton";

        @Prop({ type: Object as () => ActionButton, default: null })
        button!: ActionButton | null;

        @Prop({ type: Object as () => ContentLink, default: null })
        link!: ContentLink | null;

        showPricingModal = false;

        get isVisible(): boolean {
            return !!this.attributes.label && (!!this.button || !!this.link);
        }

        get tag(): string {
            if (this.link) {
                return "router-link";
            } else {
                return "button"
            }
        }

        get classNames(): string[] {
            let classes: string[] = [];
            let linkStyle = this.button?.linkStyle ?? this.link?.linkStyle;
            switch (linkStyle) {
                case LinkStyle.buttonPrimary:
                    classes = ["button", "primary"];
                    break;
                case LinkStyle.buttonSecondary:
                    classes = ["button", "secondary"];
                    break;
                case LinkStyle.fancyLink:
                    classes = ["link", "fancy"];
                    break;
                case LinkStyle.link:
                    classes = ["link"];
                    break;
                default:
                    break;
            }
            return classes;
        }

        get attributes(): Attributes {
            const info: Attributes = { type: "button", props: {}, label: this.link?.linkLabel ?? this.button?.label };

            if (!isBlank(this.link?.linkLabel)) {
                info.type = "router-link";
            }

            if (!isBlank(this.link?.linkTarget)) {
                info.props.target = this.link?.linkTarget;
            }
            if (!isBlank(this.link?.destinationHref)) {
                let url = this.link!.destinationHref;
                const memberId = CactusMemberService.sharedInstance.currentMember?.id
                if (this.link?.appendMemberId && memberId) {
                    url = appendQueryParams(url, { [QueryParam.CACTUS_MEMBER_ID]: memberId })
                }
                if (isExternalUrl(url)) {
                    info.type = "a";
                    info.props.href = url;
                } else {
                    info.props.to = url;
                }
            }

            switch (this.button?.action) {
                case ContentAction.next:
                    break;
                case ContentAction.previous:
                    break;
                case ContentAction.complete:
                    break;
                case ContentAction.showPricing:
                    // info.type = "router-link"
                    // info.props.target = this.button.target
                    // info.props.to = PageRoute.PRICING;
                    break;
                case ContentAction.coreValues:
                    info.type = "router-link"
                    info.props.target = LinkTarget.blank;
                    info.props.to = PageRoute.CORE_VALUES;
                    break;
                case ContentAction.unknown:
                    break;
                default:
                    break;
            }

            return info;
        }

        handleClick() {
            if (this.link) {
            }
            if (!this.button?.action) {
                this.$emit('click', arguments);
                return;
            }

            switch (this.button.action) {
                case ContentAction.showPricing:
                    this.showPricingModal = true;
                default:
                    this.$emit(this.button.action);
            }


        }
    }
</script>

<style scoped lang="scss">
    @import "prompts";

    .actionButton {
        align-items: center;
        display: flex;
        justify-content: center;
    }
</style>