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

    .actionButtonContainer {
        margin-bottom: 1.6rem;
        text-align: center;

        > * {
            margin-bottom: 1.6rem;
        }

        @include r(600) {
            display: flex;
            margin: 0 1.6rem 0 0;
            text-align: left;

            > * + * {
                margin-left: 1.6rem;
            }
        }
    }
</style>