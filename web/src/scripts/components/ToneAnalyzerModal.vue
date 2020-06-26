<template>
    <modal :show="showModal"
            v-on:close="$emit('close')"
            :showCloseButton="true"
    >
        <div slot="body" class="modalContainer">
            <h3>About Insights</h3>
            <p>We’re using a service called Tone Analyzer. When you write a note, the analyzer gives you a sense of how positive your note is.</p>
            <p>Dive deeper with the sentence-level analysis, which shows the tones that are strongest. Tones include: Anger, Fear, Joy, Sadness, Analytical, Confident, and Tentative.</p>
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
