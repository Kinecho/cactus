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
        border: 1px solid $lightest;
        border-radius: 1.2rem;
        display: flex;
        flex-basis: 33%;
        margin-right: .8rem;
        padding: 2.4rem;

        @include r(768) {
            margin-right: 1.6rem;
            padding: 3.2rem;
        }
        @include r(960) {
            flex-grow: 1;

            &:last-child {
                margin-right: 0;
            }
        }

        &:last-child {
            margin-right: 0;
        }
    }

    .statIcon {
        display: none;

        @include r(960) {
            align-items: center;
            background-color: $bgGreen;
            border-radius: 50%;
            display: flex;
            flex-shrink: 0;
            height: 8rem;
            justify-content: center;
            margin-right: 1.6rem;
            width: 8rem;

            img {
                height: 3.2rem;
                width: 3.2rem;
            }
        }
    }

    .statLabel {
        margin-bottom: .4rem;

        @include r(600) {
            margin-bottom: 0;
        }
    }

    .statValue {
        color: $mediumDolphin;
        font-size: 3.2rem;
        font-weight: bold;
        line-height: 1;

        @include r(768) {
            font-size: 5.6rem;
        }
    }

    .unit {
        font-size: 1.8rem;
        padding-left: .8rem;

        &:empty {
            display: none;
        }
    }
</style>
