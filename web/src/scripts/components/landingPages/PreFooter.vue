<template>
    <div class="centered">
        <section class="email">
            <h2 class="emailHeader">A reflection a day…</h2>
            <p class="subtext">Cactus is a different kind of mindfulness.</p>
            <slot></slot>
        </section>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"

    @Component
    export default class PreFooter extends Vue {
        name = "PreFooter";
    }
</script>

<style scoped lang="scss">
    @import "mixins";
    @import "variables";

    section.email {
        background-color: $beige;
        padding: 5.6rem 0;
        position: relative;
        z-index: 1;

        .emailHeader {
            color: $magenta;
            padding: 0 2.4rem;
        }

        .subtext {
            margin: 0 0 2.4rem;
            padding: 0 2.4rem;
        }

        .lowerForm {
            display: flex;
            flex-flow: column wrap;
            padding: 0 2.4rem 4rem;

            @include r(600) {
                flex-direction: row;
                padding: 0 2.4rem 5.6rem;
            }
            @include r(768) {
                justify-content: center;
            }
        }
    }
</style>