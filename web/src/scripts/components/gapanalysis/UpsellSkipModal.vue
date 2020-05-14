<template>
    <Modal :show="show" :show-close-button="false" :dark="true">
        <div slot="body" class="skip-body">
            <h1>Are you sure?</h1>
            <p>With Cactus Plus, you get access to exclusive tests, premium tools, personalized insights, and the endless satisfaction of knowing you’re supporting the ongoing development of Cactus.</p>
            <img src="/assets/images/cvBlob.png " alt="Test Image"/>
            <div class="actions">
                <button class="secondary" @click="$emit('confirmed')">Yes, skip this</button>
                <button class="" @click="$emit('close')">Cancel - back to quiz</button>
            </div>
        </div>
    </Modal>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import Modal from "@components/Modal.vue";
    import { Prop } from "vue-property-decorator";

    @Component({
        components: {
            Modal,
        }
    })
    export default class UpsellSkipModal extends Vue {
        name = "UpsellSkipModal";

        @Prop({ type: Boolean, required: true, default: false })
        show!: boolean;
    }
</script>

<style scoped lang="scss">
    @import "variables";

    .skip-body {
        background-color: $white;
        padding: 2rem;
        p {
            max-width: 40rem;
        }
        button {
            margin: 0 1rem 0 0;
        }
    }
</style>