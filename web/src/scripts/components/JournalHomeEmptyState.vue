<template>
    <section class="empty journalHome">
        <h1>This is your journal.</h1>
        <p>{{introText}}</p>
        <skeleton-card :animating="false"/>
        <router-link class="button primary" tag="a" :to="onboardingPath">Get Started</router-link>
    </section>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import { PageRoute } from "@shared/PageRoutes";
    import { CactusElement } from "@shared/models/CactusElement";
    import { Prop } from "vue-property-decorator";
    import Logger from "@shared/Logger"
    import ResultElement from "@components/gapanalysis/ResultElement.vue";
    import { SubscriptionTier } from "@shared/models/SubscriptionProductGroup";
    import { preventOrphanedWords } from "@shared/util/StringUtil";
    import SkeletonCard from "@components/JournalEntrySkeleton.vue";

    const logger = new Logger("MemberHomeEmptyState.vue");

    @Component({
        components: {
            ResultElement,
            SkeletonCard,
        }
    })
    export default class JournalHomeEmptyState extends Vue {
        name = "JournalHomeEmptyState.vue";

        @Prop({ type: String as () => CactusElement, default: null, required: false })
        focusElement!: CactusElement | null;

        @Prop({ type: String as () => SubscriptionTier, default: null, required: false })
        tier!: SubscriptionTier | null

        @Prop({type: String as () => string|PageRoute, default: null})
        to!: string|PageRoute|null;

        get onboardingPath(): PageRoute| string {
            return this.to ?? PageRoute.HELLO_ONBOARDING;
        }

        get introText() {
            return preventOrphanedWords("It's a little empty now, but once you complete your first question, your journal entries will appear here.");
        }
    }
</script>

<style scoped lang="scss">
    @import "mixins";
    @import "variables";

    .empty {
        display: block;
        margin: 0 auto;
        max-width: 64rem;
        padding: 2.4rem;
        text-align: center;

        h1 {
            margin-top: 2.4rem;
        }

        p {
            font-size: 2rem;
            margin-bottom: 3.2rem;
            opacity: .8;
        }

        .skeleton {
            width: 100%;
        }

        .button {
            min-width: 22rem;
        }
    }
</style>
