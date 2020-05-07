<template>
    <div>
        <img src="https://cactus.app/assets/images/cvBlob.png"/>
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