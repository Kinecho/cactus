<template>
    <div class="posRating" v-if="positivityPercentage !== null && positivityPercentage !== undefined">
        <span class="label">Positivity Rating</span>
        <strong class="rating">{{positivityPercentage | percentage}}</strong>
        <div class="progress">
            <div class="meter">
                <span class="mask" :style="`width: ${(1 - positivityPercentage) * 100}%`"></span>
            </div>
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
            percentage(input: number | string | undefined | null): string | null {
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
            const score = this.sentimentScore?.score;
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
        background-image: linear-gradient(to right, $royal, $green);
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

        .mask {
            $mask-color: lighten($lightDolphin, 20%);
            background-color: $mask-color;
            height: $multiple;
            right: 0;
            position: absolute;
            top: 0;
            width: 100%;
            mask-image: radial-gradient(circle 10px at left, transparent 0, transparent 8px, $mask-color 8px)
        }

        .gradient {
            background-color: red;
            height: $multiple;
            left: 0;
            position: absolute;
            top: 0;
            width: 100%;
        }
    }

</style>