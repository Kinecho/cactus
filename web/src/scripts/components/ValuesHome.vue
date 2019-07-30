<template>

    <div class="container">
        <NavBar/>
        <h2>Values Home</h2>
        <p>Hello There!</p>
        <Footer/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Footer from "@components/StardardFooter.vue"
    import NavBar from "@components/NavBar.vue"

    export default Vue.extend({
        components: {
            Footer: Footer,
            NavBar: NavBar,
        }
    })
</script>

<style lang="scss" scoped>
    .container {
        color: teal;
    }
</style>