<template>
    <div class="loading-page">
        <NavBar/>
        <div class="page-content">
            <spinner message="Loading..."/>
        </div>

    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import NavBar from "@components/NavBar.vue";
    import Spinner from "@components/Spinner.vue";
    import Component from "vue-class-component";

    @Component({
        components: {
            NavBar,
            Spinner,
        }
    })
    export default class LoadingPage extends Vue {

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