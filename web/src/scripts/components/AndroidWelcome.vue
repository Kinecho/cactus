<template>
    <div class="centered">
        <a :href="logoHref"><img class="large-desktop" src="/assets/images/logoWhite.svg" alt="Cactus logo"/></a>
        <p>Your private journal for mindfulness.</p>
        <button>Continue</button>
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

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";
    @import "signup";

</style>
