<template>
    <div class="centered">
        <section>
            <img class="graphic" src="/assets/images/desert.svg" alt=""/>
            <h1>Looks like something went wrong...</h1>
            <p>Since you're here, think of one person you'd love to get lost with.</p>
            <a class="button" href="/">Return Home</a>
        </section>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";

    export default Vue.extend({
        created() {

        },
        beforeMount(): void {
            document.body.classList.add("error");
        },
        props: {},
        data(): {} {
            return {}
        }
    })
</script>

<style lang="scss">
    @import "variables";
    @import "mixins";

    html, body, body.error {
        background: $lightPink;
    }

    body {
        @include h(768) {
            align-items: center;
            display: flex;
            height: 100vh;
            justify-content: center;
        }
    }
</style>

<style lang="scss" scoped>
    @import "mixins";
    @import "variables";

    .centered {
        overflow-x: hidden;
        width: 100%;
    }

    section {
        padding: 2.4rem;
    }

    .graphic {
        margin-bottom: 3.2rem;
        max-width: 100%;
        width: 50rem;
    }

    h1 {
        margin: 0;
    }

    p {
        margin: .8rem auto 4rem;
    }


</style>
