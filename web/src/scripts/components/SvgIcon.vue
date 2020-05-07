<template>
    <img class="icon" v-if="icon" :src="imageUrl" :alt="icon"/>
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

        get imageUrl(): string {
            return `/assets/images/${ this.icon }.svg`
        }
    }
</script>

<style scoped lang="scss">

</style>