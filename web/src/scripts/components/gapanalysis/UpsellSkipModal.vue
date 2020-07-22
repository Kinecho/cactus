<template>
    <Modal :show="show" :show-close-button="false" :dark="true">
        <div slot="body" class="skip-body">
            <h2>Close the quiz?</h2>
            <p>Leave now and your answers will be discarded. Start a free trial to <strong>get your quiz results</strong>, plus tools designed to help you understand what makes you&nbsp;happy.
            <div class="actions">
                <button class="" @click="$emit('close')">Try It Free</button>
                <button class="secondary" @click="$emit('confirmed')">Discard my answers</button>
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
    @import "mixins";

    .skip-body {
        @include shadowbox;
        background-image: url(/assets/images/crosses2.svg),
        url(/assets/images/outlineBlob.svg),
        url(/assets/images/royalBlob.svg),
        url(/assets/images/pinkBlob5.svg);
        background-position: -1rem 34rem, right -29rem top -32rem, -20rem 21rem, 61% -142px;
        background-repeat: no-repeat, no-repeat, no-repeat, no-repeat;
        background-size: 20rem, 48rem, 30rem, 23rem;
        margin: 0 1.6rem;
        padding: 3.2rem;

        @include r(600) {
            background-position: -1rem 26rem, right -9rem top -34rem, -11rem 21rem, 61% -140px;
            margin: 0 auto;
            max-width: 68rem;
        }
    }

    h2 {
        margin-bottom: .8rem;
    }

    p {
        margin-bottom: 3.2rem;
        opacity: .8;
    }

    .actions {
        button {
            margin-bottom: 1.6rem;
            width: 100%;
        }

        @include r(600) {
            display: flex;

            button {
                margin-right: .8rem;
                max-width: none;
            }
        }
    }
</style>
