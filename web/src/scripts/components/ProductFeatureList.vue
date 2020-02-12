<template>
    <ul v-if="features && features.length > 0">
        <li v-for="(feature, index) in features" :class="{
            [`icon`]: feature.icon,
            [feature.icon]: feature.icon
        }">
            <markdown :source="feature.descriptionMarkdown"/>
        </li>
    </ul>
</template>

<script lang="ts">
    import Vue from "vue";
    import {ProductFeature} from "@shared/models/SubscriptionProductGroup";
    import MarkdownText from "@components/MarkdownText.vue";

    export default Vue.extend({
        components: {
            Markdown: MarkdownText
        },
        props: {
            features: {type: Array as () => ProductFeature[], required: false, default: []}
        },
        data(): {} {
            return {}
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    ul {
        list-style: none;
        margin: 0 0 4rem -.6rem;
        padding: 0;
    }

    li {
        display: flex;
        margin-bottom: 1.2rem;
    }

    li.icon {
        &:before, &.check:before {
            background-image: url(assets/images/check.svg);
            background-repeat: no-repeat;
            background-size: contain;
            content: "";
            display: inline-block;
            height: 1.3rem;
            margin-right: 1.6rem;
            width: 1.8rem;

        }

        &.heart:before {
            background-image: url(assets/icons/heart.svg);
            height: 1.5rem;
        }
    }

</style>
