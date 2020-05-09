<template>
    <div class="processingContainer">
        <img class="royal" src="assets/images/royalBlob.svg" alt=""/>
        <img class="pink" src="assets/images/darkGreenBlob.svg" alt=""/>
        <p class="message">Processing results...</p>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"

    export default class ResultsProcessing extends Vue {
        name = "ResultsProcessing";
    }
</script>

<style scoped lang="scss">
    @import "mixins";

    .processingContainer {
        background-color: $white;
        height: 100vh;

        @include r(768) {
            background-color: transparent;
            height: auto;
        }
    }

    img {
        left: 50%;
        margin: auto;
        mix-blend-mode: multiply;
        position: absolute;
        top: 50%;

        &.royal {
            animation: rotateInfinite 45s infinite normal;
            height: 28rem;
            margin: -25rem 0 0 -15rem;
            width: 28rem;
        }

        &.pink {
            animation: rotateInfinite 30s infinite reverse;
            height: 24rem;
            margin: -21rem 0 0 -11rem;
            width: 24rem;
        }
    }

    .message {
        opacity: .8;
        padding-top: 80vh;

        @include r(768) {
            padding-top: 44rem;
        }
    }
</style>
