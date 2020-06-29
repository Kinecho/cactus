<template>
    <modal :show="showModal"
            v-on:close="$emit('close')"
            :showCloseButton="true"
    >
        <div slot="body" class="modalContainer">
            <h3>About Insights</h3>
            <p>We use a service called Tone Analyzer. It gives you a positivity rating on your written notes.</p>
            <p>You can also see which tones are sensed in your writing, and where. These include Anger, Fear, Joy, Sadness, Analytical, Confident, and Tentative.</p>
            <p>Your notes remain private, secure, and forever yours.</p>
        </div>
    </modal>
</template>

<script lang="ts">
    import Vue from "vue";
    import Modal from "@components/Modal.vue";

    export default Vue.extend({
        components: {
            Modal,
        },
        props: {
            showModal: {type: Boolean, default: false},
        },
        data(): {
        } {
            return {
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .modalContainer {
        background-color: $darkestGreen;
        border-radius: 1.2rem;
        max-width: 44rem;
        overflow: hidden;
        padding: 4rem 2.4rem 2.4rem;
        width: 100%;
    }

    h3 {
        color: $white;
        margin-bottom: 1.6rem;
    }

    p {
        color: $lightGreen;
        margin-bottom: 1.6rem;
    }

</style>
