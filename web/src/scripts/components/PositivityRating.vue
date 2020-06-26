<template>
    <div class="posRating" v-if="positivityPercentage">
        <span class="label">Positivity Rating</span>
        <strong class="rating">{{positivityPercentage | percentage}}</strong>
        <div class="progress">
            <div class="meter" :style="`width: ${positivityPercentage * 100}%`"><span class="gradient"></span></div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import { Prop } from "vue-property-decorator";
    import { formatPercentage } from "@shared/util/StringUtil";
    import { SentimentScore } from "@shared/api/InsightLanguageTypes";
    import { isNull } from "@shared/util/ObjectUtil";

    @Component({
        filters: {
            percentage(input: number | string | undefined | null): string {
                return formatPercentage(input, 0);
            }
        }
    })
    export default class PositivityRating extends Vue {
        name = "PositivityRating";

        @Prop({ type: Object as () => SentimentScore, required: false, default: null })
        sentimentScore!: SentimentScore | null;

        /**
         * Return the rating on a scale of 0 - 1
         * @return {number}
         */
        get positivityPercentage(): number | null {
            const score = this.sentimentScore.score;
            if (isNull(score)) {
                return null;
            }
            return (score + 1) / 2;
        }

    }
</script>

<style scoped lang="scss">
    @import "mixins";
    @import "variables";

    .label {
        font-size: 1.6rem;
        opacity: .8;

        &:after {
            content: ":";
            display: inline-block;
            margin-right: .8rem;
        }
    }

    .progress {
        $multiple: 1.6rem;
        background-color: lighten($lightDolphin, 20%);
        border-radius: $multiple;
        height: $multiple;
        margin: .8rem 0 3.2rem;

        @include r(600) {
            margin-bottom: 4rem;
        }

        .meter {
            border-radius: $multiple;
            height: $multiple;
            overflow: hidden;
            position: relative;
        }

        .gradient {
            background-image: linear-gradient(to right, $royal, $green);
            height: $multiple;
            left: 0;
            position: absolute;
            top: 0;
            width: 25.6rem;

            @include r(374) {
                width: 53.5rem;
            }
            @include r(600) {
                width: 40rem;
            }
            @include r(768) {
                width: 46.8rem;
            }
        }
    }

</style>