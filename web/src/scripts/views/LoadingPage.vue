<template>
    <div class="loading-page">
        <div class="page-content">
            <spinner message="Loading..."/>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Spinner from "@components/Spinner.vue";
    import Component from "vue-class-component";

    @Component({
        components: {
            Spinner,
        }
    })
    export default class LoadingPage extends Vue {
        name = "LoadingPage";
    }
</script>

<style scoped lang="scss">
    .loading-page {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        background: white;
        flex: 1;

        .page-content {
            flex: 1;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
        }
    }
</style>