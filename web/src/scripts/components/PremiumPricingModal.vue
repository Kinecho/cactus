<template>
    <modal :show="showModal"
            v-on:close="$emit('close')"
            :showCloseButton="true"
    >
        <div slot="body" class="modalContainer">
            Premium Pricing modal here!
        </div>
    </modal>
</template>

<script lang="ts">
    import Vue from "vue";
    import Modal from "@components/Modal.vue";
    import CopyService from '@shared/copy/CopyService';
    import {ElementCopy} from '@shared/copy/CopyTypes';

    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
        components: {
            Modal,
        },
        props: {
            showModal: {type: Boolean, default: false},
            navigationEnabled: {type: Boolean, default: true},
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
        color: $lightGreen;
        display: flex;
        min-height: 34rem;
        overflow: hidden;
        width: 30rem;
    }
</style>
