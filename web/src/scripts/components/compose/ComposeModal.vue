<template>
    <modal :show="show" @close="close" :show-close-button="false" :dark="true" id="freeform-compose-modal">
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
        @include shadowbox;
        padding: 2rem;
    }
</style>