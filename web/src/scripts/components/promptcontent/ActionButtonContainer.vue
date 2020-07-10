<template>
    <div class="actionButtonContainer" v-if="hasButtons">
        <slot></slot>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
   
    @Component
    export default class ActionButtonContainer extends Vue {
        name = "ActionButtonContainer";

        get hasButtons(): boolean {
            return this.$slots.default?.some(n => !n.isComment) ?? false
        }
    }
</script>

<style scoped lang="scss">
    @import "mixins";
    @import "variables";
    @import "prompts";

    .actionButtonContainer {
        @include r(600) {
            display: flex;
        }
    }
</style>
