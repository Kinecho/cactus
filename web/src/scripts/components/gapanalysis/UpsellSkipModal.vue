<template>
    <Modal :show="show" :show-close-button="false">
        <div slot="body" class="skip-body">
            <h1>Are you sure?</h1>
            <img src="/assets/images/cvBlob.png " alt="Test Image"/>
            <div class="actions">
                <button @click="$emit('close')">Cancel - back to assessment</button>
                <button @click="$emit('confirmed')">Yes, skip this</button>
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
    }
</style>