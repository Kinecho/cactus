<template>
    <!--  Need the wrapper DIV so we can put a modal in here  -->
    <div>
        <button class="composeBtn" @click="start">
            <svg class="pen wiggle" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                <title>Compose</title>
                <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
            </svg>
            <span>{{copy.navigation.COMPOSE}}</span>
        </button>
        <compose-modal
                :show="editing"
                :member="member"
                :prompt="prompt"
                :reflection="reflection"
                @close="close"
                @saved="onSaved"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import CactusMember from "@shared/models/CactusMember";
    import { Prop } from "vue-property-decorator";
    import CopyService from "@shared/copy/CopyService";
    import Modal from "@components/Modal.vue";
    import ComposeFreeformNote from "@components/freeform/ComposeFreeformNote.vue";
    import ComposeModal from "@components/freeform/ComposeModal.vue";
    import { FreeFormSaveEvent } from "@web/managers/ReflectionManagerTypes";
    import ReflectionPrompt from "@shared/models/ReflectionPrompt";
    import ReflectionResponse from "@shared/models/ReflectionResponse";

    const copy = CopyService.getSharedInstance().copy;

    @Component({
        components: {
            ComposeModal,
            ComposeFreeform: ComposeFreeformNote,
            Modal
        }
    })
    export default class ComposeButton extends Vue {
        name = "ComposeButton";

        @Prop({ type: Object as () => CactusMember, required: true })
        member!: CactusMember;

        copy = copy;
        editing = false;

        prompt: ReflectionPrompt | null = null;
        reflection: ReflectionResponse | null = null;

        async start() {
            this.editing = true;
        }

        close() {
            this.editing = false
            this.reflection = null;
            this.prompt = null;
        }

        async onSaved(saveEvent: FreeFormSaveEvent) {
            const { prompt, reflectionResponse } = saveEvent;
            this.prompt = prompt;
            this.reflection = reflectionResponse;
        }
    }
</script>

<style scoped lang="scss">
    @import "mixins";
    @import "variables";

    .composeBtn {
        align-items: center;
        background-color: $green;
        border: 0;
        border-radius: 50%;
        bottom: 1.6rem;
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1), 0 6px 6px rgba(0, 0, 0, 0.1);
        display: flex;
        height: 5.6rem;
        justify-content: center;
        padding: .8rem;
        position: fixed;
        right: 1.6rem;
        transition: background-color .3s;
        width: 5.6rem;
        z-index: $z-fabContainer;

        .pen {
            height: 2rem;
            width: 2rem;
        }

        span {
            display: none;
        }

        &:hover,
        &:active {
            background-color: $darkGreen;

            .pen {
                animation: wiggle .5s forwards;
            }
        }

        @include r(600) {
            @include smallButton;
            border-radius: 3rem;
            bottom: auto;
            color: white;
            height: auto;
            position: static;
            right: auto;
            text-decoration: none;
            transition: background-color .3s;
            width: auto;

            .pen {
                height: 1.5rem;
                margin-right: .4rem;
                margin-top: .1rem;
                width: 1.5rem;
            }

            span {
                display: block;
            }
        }
    }

</style>