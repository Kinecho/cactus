<template>
    <div class="stat">
        <div class="statIcon">
            <!--            <img :src="`/assets/images/${stat.icon}.svg`" :alt="`${stat.label} icon`"/>-->
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

    .stat {
        align-items: center;
        border: 1px solid $lightest;
        border-radius: 1.2rem;
        display: flex;
        flex-basis: 33%;
        margin-right: 1.6rem;
        padding: 3.2rem;

        @include r(960) {
            @include shadowbox;
            border: 0;
            flex-grow: 1;

            &:last-child {
                margin-right: 0;
            }
        }
    }

    .statIcon {
        align-items: center;
        background-color: lighten($beige, 3%);
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

    .statLabel {
        color: $lightText;
        font-size: 1.6rem;
    }

    .statValue {
        color: $green;
        font-size: 5.6rem;
        font-weight: bold;
        line-height: 1;
    }

    .unit {
        font-size: 1.8rem;
        padding-left: .8rem;

        &:empty {
            display: none;
        }
    }
</style>