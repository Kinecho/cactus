<template>
    <div class="split">
        <slot></slot>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"

    @Component
    export default class Split extends Vue {
        name = "Split";
    }
</script>

<style scoped lang="scss">
    @import "mixins";
    @import "variables";

    .split {
        @include r(768) {
            display: flex;
            max-width: none;

            > * {
                flex-basis: 50%;
            }
        }

        .subtext {
            margin: 0 auto 2.4rem;
            max-width: 40rem;
            text-align: center;

            @include r(768) {
                margin-bottom: 5.6rem;
            }
        }
    }
</style>