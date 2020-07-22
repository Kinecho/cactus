<template>
    <modal :show="show" @close="close" :show-close-button="true" :dark="true" :fullScreen="true" id="freeform-compose-modal">
        <template v-slot:body>
            <div class="freeform-modal">
                <compose-freeform @cancel="close" :member="member"/>
            </div>
        </template>
    </modal>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import { Prop } from "vue-property-decorator";
    import Modal from "@components/Modal.vue";
    import ComposeFreeform from "@components/compose/ComposeFreeform.vue";
    import CactusMember from "@shared/models/CactusMember";

    @Component({
        components: {
            ComposeFreeform,
            Modal
        }
    })
    export default class ComposeModal extends Vue {
        name = "ComposeModal";

        @Prop({ type: Boolean, default: false })
        show!: boolean;

        @Prop({type: Object as () => CactusMember, required: true})
        member!: CactusMember;

        close() {
            this.$emit('close')
        }
    }
</script>

<style scoped lang="scss">
    @import "mixins";
    @import "variables";

    .freeform-modal {
        background-color: $white;
        height: 100%;
        padding: 2.4rem;
        position: relative;
        width: 100%;

        @include r(768) {
            align-items: center;
            display: flex;
            justify-content: center;
        }
    }
</style>