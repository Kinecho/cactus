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
    @import "prompts";

    .actionButtonContainer {
        @include r(600) {
            display: flex;
        }
    }
</style>