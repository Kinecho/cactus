<template>
    <img class="icon" v-if="icon" :src="imageUrl" :alt="icon" :class="[size]"/>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import { SvgIconName } from "@shared/types/IconTypes";
    import { Prop } from "vue-property-decorator";

    @Component
    export default class SvgIcon extends Vue {
        name = "SvgIcon";

        @Prop({ type: String as () => SvgIconName, required: true })
        icon!: SvgIconName;

        @Prop({ type: String, required: false, default: "default" })
        size!: "default" | "large" | "small" | null;

        get imageUrl(): string {
            return `/assets/icons/${ this.icon }.svg`
        }
    }
</script>

<style scoped lang="scss">
    @import "common";
    @import "variables";
    @import "mixins";

    .default {
        width: 2.4rem;
    }
</style>