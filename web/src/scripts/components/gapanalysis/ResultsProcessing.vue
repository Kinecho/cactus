<template>
    <div>
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

    img {
        left: 50%;
        margin: auto;
        mix-blend-mode: multiply;
        position: absolute;
        top: 50%;

        &.royal {
            animation: rotateInfinite 45s infinite normal;
            height: 28rem;
            margin: -27rem 0 0 -17rem;
            width: 28rem;
        }

        &.pink {
            animation: rotateInfinite 30s infinite reverse;
            height: 24rem;
            margin: -19rem 0 0 -9rem;
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
