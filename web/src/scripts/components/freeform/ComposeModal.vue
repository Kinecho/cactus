<template>
    <modal :show="show"
            @close="close"
            :show-close-button="true"
            :dark="true"
            :fullScreen="true"
            :id="modalId">
        <template v-slot:body>
            <div class="freeform-modal">
                <compose-freeform
                        :member="member"
                        :prompt="prompt"
                        :reflection="reflection"
                        @saved="onSaved"
                        @close="close"
                />
            </div>
        </template>
    </modal>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import { Prop } from "vue-property-decorator";
    import Modal from "@components/Modal.vue";
    import ComposeFreeformNote from "@components/freeform/ComposeFreeformNote.vue";
    import CactusMember from "@shared/models/CactusMember";
    import { FreeFormSaveEvent } from "@web/managers/ReflectionManagerTypes";
    import ReflectionPrompt from "@shared/models/ReflectionPrompt";
    import ReflectionResponse from "@shared/models/ReflectionResponse";
    import * as uuid from "uuid/v4";

    @Component({
        components: {
            ComposeFreeform: ComposeFreeformNote,
            Modal
        }
    })
    export default class ComposeModal extends Vue {
        name = "ComposeModal";

        @Prop({ type: Boolean, default: false })
        show!: boolean;

        @Prop({ type: Object as () => CactusMember, required: true })
        member!: CactusMember;

        @Prop({ type: Object as () => ReflectionPrompt, required: false, default: null })
        prompt!: ReflectionPrompt | null;

        @Prop({ type: Object as () => ReflectionResponse, required: false, default: null })
        reflection!: ReflectionResponse | null;

        modalId = "compose_modal_" + uuid();

        close() {
            this.$emit('close')
        }

        onSaved(saveEvent: FreeFormSaveEvent) {
            this.$emit('saved', saveEvent)
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