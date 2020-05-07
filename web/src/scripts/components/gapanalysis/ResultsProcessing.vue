<template>
    <div>
        <spinner message="Processing Results"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import Spinner from "@components/Spinner.vue";

    @Component({
        components: { Spinner }
    })
    export default class ResultsProcessing extends Vue {
        name = "ResultsProcessing";
    }
</script>

<style scoped lang="scss">

</style>