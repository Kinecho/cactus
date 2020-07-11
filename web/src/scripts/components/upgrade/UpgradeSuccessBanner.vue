<template>
    <snackbar-content
            class="upgrade-confirmation"
            :closeable="true"
            :autoHide="false"
            @close="close"
            color="successAlt">
        <div slot="text" class="centered">
            <h3>Welcome to Cactus Plus!</h3>
            <p>Now you have full access to personalized activities, insights, and tools to help you better know
                yourself. If you have questions or feedback, please reach out to us at
                <a href="mailto:help@cactus.app">help@cactus.app</a>.</p>
        </div>
    </snackbar-content>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import SnackbarContent from "@components/SnackbarContent.vue";

    @Component({
        components: {
            SnackbarContent
        }
    })
    export default class UpgradeSuccessBanner extends Vue {
        name = "UpgradeSuccessBanner";

        close() {
            this.$emit('close');
        }
    }
</script>

<style scoped lang="scss">
    @import "mixins";
    @import "variables";

    .upgrade-confirmation {
        border-radius: 0;
        display: block;
        padding: 3.2rem 2.4rem;

        .centered {
            max-width: 64rem;
        }

        h3 {
            font-size: 2.4rem;
            margin-bottom: .4rem;
        }

        p {
            opacity: .9;
        }

        a {
            @include fancyLinkLight;
        }
    }
</style>