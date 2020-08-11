<template>
    <div class="stat">
        <div class="statIcon">
            <svg-icon :icon="stat.icon"/>
        </div>
        <div class="textContainer">
            <p class="statLabel">{{stat.label}}</p>
            <p class="statValue">{{stat.value}}<span class="unit">{{stat.unit}}</span></p>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import { StatWidgetData } from "@components/insights/MemberStatsTypes";
    import { Prop } from "vue-property-decorator";
    import SvgIcon from "@components/SvgIcon.vue";

    @Component({
        components: { SvgIcon },
    })
    export default class StatWidget extends Vue {
        name = "StatWidget";

        @Prop({ type: Object as () => StatWidgetData, required: true })
        stat!: StatWidgetData;
    }
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";
    @import "insights";

    .stat {
        align-items: center;
        border-radius: 1.2rem;
        display: flex;
        flex-basis: 50%;

        @include r(374) {
            justify-content: center;
        }
        @include r(600) {
            margin-right: 1.6rem;
        }
        @include r(1024) {
            border: 1px solid darken($bgDolphin, 3%);
            padding: 3.2rem;

            &:last-child {
                margin-right: 0;
            }
        }
    }

    .statIcon {
        align-items: center;
        background-color: $bgGreen;
        border-radius: 50%;
        display: flex;
        flex-shrink: 0;
        height: 4rem;
        justify-content: center;
        margin-right: .8rem;
        width: 4rem;

        @include r(374) {
            height: 5.6rem;
            width: 5.6rem;
        }
        @include r(600) {
            height: 6.4rem;
            width: 6.4rem;
        }
        @include r(960) {
            height: 8rem;
            margin-right: 1.6rem;
            width: 8rem;
        }

        img {
            height: 2rem;
            width: 2rem;

            @include r(600) {
                height: 2.4rem;
                width: 2.4rem;
            }
            @include r(960) {
                height: 3.2rem;
                width: 3.2rem;
            }
        }
    }

    .statLabel {
        @include r(374) {
            margin-bottom: .4rem;
        }
        @include r(600) {
            margin-bottom: 0;
        }
    }

    .statValue {
        color: $mediumDolphin;
        font-size: 3.2rem;
        font-weight: bold;
        line-height: 1;

        @include r(600) {
            font-size: 4rem;
        }
        @include r(960) {
            font-size: 5.6rem;
        }
    }

    .unit {
        font-size: 1.8rem;

        &:empty {
            display: none;
        }
    }
</style>
