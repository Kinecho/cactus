<template>
    <div>
        <router-view/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";

    export default Vue.extend({
        created(){

        },
        props: {

        },
        data():{
            field: any|undefined,
        }{
            return {
                field: undefined,
            }
        }
    })
</script>

<style lang="scss" >
    @import "common";

</style>
