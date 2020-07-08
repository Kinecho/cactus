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
        margin-bottom: 1.6rem;
        text-align: center;

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