<template>
    <div>
        <NavBar/>
        <h1>Member Insights</h1>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";
    import NavBar from "@components/NavBar.vue";

    @Component({
        components: {
            NavBar,
        }
    })
    export default class InsightsPage extends Vue {

    }
</script>

<style scoped lang="scss">

</style>