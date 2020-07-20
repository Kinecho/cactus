<template>
    <section class="fortify">
        <h2>Fortify your EQ</h2>
        <p class="subtext">Cactus helps make you more optimistic, generous to yourself and others,
            and&nbsp;healthier.</p>
        <img src="/assets/images/200629.png" alt="Fortify image" class="sectionImg"/>
    </section>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"

    @Component
    export default class FortifyEQ extends Vue {
        name = "FortifyEQ";
    }
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";

    .subtext {
        opacity: .8;
        margin: 0 auto 2.4rem;
        max-width: 40rem;
        text-align: center;

        @include r(768) {
            margin-bottom: 5.6rem;
        }
        @include r(960) {
            font-size: 2rem;
        }
    }

    .fortify {
        align-items: center;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        padding: 4.8rem 2.4rem;

        @include r(768) {
            padding: 11rem 2.4rem;
        }

        .sectionImg {
            margin-left: 1.6rem;
            width: 40rem;
        }
    }
</style>