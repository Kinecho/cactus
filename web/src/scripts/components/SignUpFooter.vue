<template>
    <div class="signup-footer">
        <div id="signupAnchor"></div>
        <div class="centered">
            <section class="email">
                <h2 class="emailHeader">A Reflection a Day…</h2>
                <p class="subtext">A Different Kind of Mindfulness</p>
                <form id="email-form-bottom" class="lower">
                    <div class="alert error hidden">Sorry, looks like we have issues.</div>
                    <magic-link :buttonText="buttonText"/>
                </form>
            </section>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import MagicLink from "@components/MagicLinkInput.vue";
    import CopyService from "@shared/copy/CopyService";

    const copy = CopyService.getSharedInstance().copy;
    export default Vue.extend({
        components: {
            MagicLink,
        },
        created() {

        },
        props: {
            buttonText: {
                type: String,
                default: copy.auth.SIGN_UP_FREE,
            }
        },
        data(): {} {
            return {}
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .signup-footer {
        background: url("/assets/images/yellowNeedles.svg") repeat, $yellow;
        padding: 1.6rem;
        margin: 0 auto;
        position: relative;
        @include r(600){
            max-width: 80rem;
            border-radius: .5rem;
            top: 3rem;
            z-index: 3;
        }
    }

</style>
