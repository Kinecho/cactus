<template>
    <div class="compose-container">
        <h1>Freeform compose</h1>
        <p>
            Enter whatever you want.
        </p>
        <section class="title">
            <input type="text" placeholder="Enter a title"/>
        </section>
        <section class="note">
            <textarea/>
        </section>
        <section class="actions">
            <button @click="$emit('cancel')">Cancel</button>
        </section>

    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"

    @Component
    export default class ComposeFreeform extends Vue {
        name = "ComposeFreeform";
    }
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";

    // This component should avoid having any styles specific to being a modal
    // We should assume this could be rendered in any type fo container - it's own page, a modal, whatever.
    // Apply any modal container styles in `ComposeModal.vue`.
    .compose-container {

    }
</style>