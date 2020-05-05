<template>
    <transition name="component-fade" appear mode="out-in">
        <router-view/>
    </transition>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";

    @Component
    export default class App extends Vue {

    }
</script>

<style lang="scss">
    @import "common";
    @import "transitions";
</style>
