<template>
    <div class="sponsorContainer">
        <NavBar :isSticky="false"/>
        <div class="centered content">
            <h1>Sponsor Cactus</h1>
            <p>Would you like to reach an audience of ~20,000 mindful journal-ers? We offer single-day and week-long sponsorships opportunities. Your brand, message, and link will be included in a daily email and journal prompt. We'll also tweet a thank you to our ~1,600 followers on <a href="https://twitter.com/itscalledcactus" target="_blank">Twitter</a>.</p>
            <p>For more details, email <a href="mailto:ryan@cactus.app">ryan@cactus.app</a>.</p>
        </div>
        <Footer/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import NavBar from "@components/NavBar.vue";
    import Footer from "@components/StandardFooter.vue";

    export default Vue.extend({
        components: {
            NavBar,
            Footer,
        },
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

    .sponsorContainer {
        display: flex;
        flex-flow: column nowrap;
        min-height: 100vh;
        justify-content: space-between;
        overflow: hidden;

        header, .centered {
            width: 100%;
        }
    }

    .centered.content {
        background-color: $beige;
        flex-grow: 1;
        max-width: none;
        overflow: hidden;
        padding: 6.4rem 2.4rem;
        position: relative;
        text-align: left;

        &:after {
            background: url(/assets/images/royalBlob.png) 0 0/228px 216px no-repeat;
            content: "";
            display: block;
            height: 216px;
            overflow: hidden;
            position: absolute;
            left: 80%;
            top: -6rem;
            transform: rotate(145deg);
            width: 228px;
            z-index: 10;
        }

        &:before {
            background: url(/assets/images/crossesBlue.svg) 0 0/228px 216px no-repeat;
            content: "";
            bottom: 4rem;
            display: block;
            height: 216px;
            overflow: hidden;
            position: absolute;
            right: 80%;
            transform: rotate(35deg);
            width: 228px;
            z-index: 10;

            @include r(768) {
                bottom: 7rem;
            }
        }
    }

    h1, p {
        margin: 0 auto 3.2rem;
        max-width: 80rem
    }

</style>
