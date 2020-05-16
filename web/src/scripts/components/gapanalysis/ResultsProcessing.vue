<template>
    <div>
        <img class="royal" src="/assets/images/royalBlob.svg" alt=""/>
        <img class="green" src="/assets/images/darkGreenBlob.svg" alt=""/>
        <p class="message">Processing results...</p>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"

    @Component
    export default class ResultsProcessing extends Vue {
        name = "ResultsProcessing";
    }
</script>

<style scoped lang="scss">
    @import "mixins";

    img {
        left: 50%;
        margin: auto;
        mix-blend-mode: multiply;
        position: absolute;
        top: 50%;

        &.royal {
            animation: rotateInfinite 45s infinite normal;
            height: 28rem;
            margin: -14rem 0 0 -11rem;
            width: 28rem;
        }

        &.green {
            animation: rotateInfinite 30s infinite reverse;
            height: 24rem;
            margin: -12rem 0 0 -15rem;
            width: 24rem;
        }
    }

    .message {
        opacity: .8;
        padding: 80vh 2.4rem 4rem;
        text-align: center;

        @include r(768) {
            padding: 44rem 4rem 4rem;
        }
    }
</style>
