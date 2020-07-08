<template>
    <div class="actionButtonContainer">
        <slot></slot>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"

    @Component
    export default class ActionButtonContainer extends Vue {
        name = "ActionButtonContainer";
    }
</script>

<style scoped lang="scss">
    @import "mixins";
    @import "variables";

    .actionButtonContainer {
        @include r(600) {
            display: flex;
            min-width: 32rem;
        }
    }

    .button {
        margin-bottom: 1.6rem;
        white-space: nowrap;
        width: 100%;

        @include r(600) {
            margin-bottom: 0;
            
        }
    }

    .button + .button {
        @include r(600) {
            margin-left: 1.6rem;
        }
    }
</style>