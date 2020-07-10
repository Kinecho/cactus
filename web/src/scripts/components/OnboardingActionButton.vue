<template>
    <component v-if="isVisible"
            class="action-button"
            :is="attributes.type"
            :class="classNames"
            v-bind="attributes.props"
            @click="handleClick">{{button.label}}
    </component>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import { Prop } from "vue-property-decorator";
    import { LinkableActionButton } from "@components/onboarding/OnboardingCardViewModel";
    import { ContentAction, LinkStyle } from "@shared/models/PromptContent";
    import { isBlank } from "@shared/util/StringUtil";
    import Logger from "@shared/Logger"
    import { PageRoute } from "@shared/PageRoutes";

    const logger = new Logger("ActionButton");


    interface Attributes {
        type: string,
        props: any,
    }

    @Component
    export default class OnboardingActionButton extends Vue {
        name = "OnboardingActionButton";

        @Prop({ type: Object as () => LinkableActionButton, required: true })
        button!: LinkableActionButton;

        get tag(): string {
            if (this.button.href) {
                return "router-link";
            } else {
                return "button"
            }
        }

        get isVisible(): boolean {
            return this.button.action !== ContentAction.unknown;
        }

        get attributes(): Attributes {
            const info: Attributes = { type: "button", props: {} };
            if (!isBlank(this.button.href)) {
                info.type = "router-link";
            }

            if (!isBlank(this.button.target)) {
                info.props.target = this.button.target
            }

            switch (this.button.action) {
                case ContentAction.next:
                    break;
                case ContentAction.previous:
                    break;
                case ContentAction.complete:
                    break;
                case ContentAction.showPricing:
                    info.type = "router-link"
                    info.props.target = this.button.target
                    info.props.to = PageRoute.PRICING;
                    break;
                case ContentAction.coreValues:
                    info.type = "router-link"
                    info.props.target = this.button.target
                    info.props.to = PageRoute.CORE_VALUES;
                    break;
                case ContentAction.unknown:
                    break;
                default:
                    break;
            }

            return info;
        }

        get classNames(): string[] {
            let classes: string[] = [];
            switch (this.button.linkStyle) {
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

        handleClick() {
            if (!this.button.action) {
                this.$emit('click', arguments);
                return;
            }
            this.$emit(this.button.action);
        }

    }
</script>

<style scoped lang="scss">
    @import "common";

    .action-button {
        .link {
            font-size: 2rem;
        }
    }
</style>