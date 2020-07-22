<template>
    <section class="empty journalHome">
        <p v-if="!focusElement || !isPlusMember">
            To get started, you'll learn about how Cactus works and reflect on your first question of
            the&nbsp;day.
        </p>

        <template v-if="focusElement && isPlusMember">
            <p>
                To get started, you'll learn about how Cactus works and reflect on your first question
                about&nbsp;<strong>{{focusElement}}</strong>.
            </p>
        </template>
        <img class="graphic" src="/assets/images/emptyState.png" alt="Three friends welcoming you"/>
        <router-link class="button primary" tag="button" :to="onboardingPath">Let's Begin</router-link>
    </section>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import { PageRoute } from "@shared/PageRoutes";
    import { Config } from "@web/config";
    import AppSettingsService from "@web/services/AppSettingsService";
    import { CactusElement } from "@shared/models/CactusElement";
    import { Prop } from "vue-property-decorator";
    import Logger from "@shared/Logger"
    import ResultElement from "@components/gapanalysis/ResultElement.vue";
    import { SubscriptionTier } from "@shared/models/SubscriptionProductGroup";
    import { isPremiumTier } from "@shared/models/MemberSubscription";

    const logger = new Logger("MemberHomeEmptyState.vue");

    @Component({
        components: {
            ResultElement,
        }
    })
    export default class MemberHomeEmptyState extends Vue {
        name = "MemberHomeEmptyState.vue";

        @Prop({ type: String as () => CactusElement, default: null, required: false })
        focusElement!: CactusElement | null;

        @Prop({ type: String as () => SubscriptionTier, default: null, required: false })
        tier!: SubscriptionTier | null

        get isPlusMember(): boolean {
            return !!this.tier && isPremiumTier(this.tier);
        }

        get onboardingPath(): PageRoute {
            return PageRoute.HELLO_ONBOARDING;
        }

        get firstPromptPath(): string {
            const appSettings = AppSettingsService.sharedInstance.currentSettings;
            const entryId = this.focusElement ? appSettings?.getElementOnboardingPromptEntryId(this.focusElement) : undefined;

            if (!entryId && this.focusElement) {
                logger.warn("No entry id found for element", this.focusElement)
            }

            if (!this.focusElement || !entryId || !this.isPlusMember) {
                return PageRoute.PROMPTS_ROOT + '/' + Config.firstPromptId;
            }

            return `${ PageRoute.PROMPTS_ROOT }/${ entryId }`;
        }
    }
</script>

<style scoped lang="scss">
    @import "mixins";
    @import "variables";

    .empty {
        align-items: center;
        justify-content: center;
        padding: 0 2.4rem 2.4rem;
        text-align: center;
        flex-direction: column;
        display: flex;

        h1 {
            line-height: 1.2;
        }

        p {
            font-size: 2rem;
            margin: 0 auto 2.4rem;
            max-width: 60rem;
            opacity: .8;
        }

        .graphic {
            margin-bottom: 2.4rem;
            max-width: 56rem;
            width: 90%;

            @include r(768) {
                margin-bottom: 2.4rem;
            }
        }

        .button {
            min-width: 22rem;
        }
    }
</style>
