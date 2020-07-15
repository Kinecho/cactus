<template>
    <section class="fortify">
        <h2>Fortify your EQ</h2>
        <p class="subtext">Cactus helps make you more optimistic, generous to yourself and others,
            and&nbsp;healthier.</p>
        <img src="/assets/images/fortify.png" alt="Fortify image" class="sectionImg"/>
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