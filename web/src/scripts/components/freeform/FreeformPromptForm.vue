<template>
    <div class="freeform-form">
        <section class="title">
            <input type="text"
                    class="titleInput"
                    placeholder="Title"
                    v-model="form.title"
                    @focus="titleSelected = true"
                    @blur="titleSelected = false"
            />
        </section>
        <section class="note">
            <resizable-textarea :max-height-px="maxTextareaHeight">
                    <textarea placeholder="Write something..."
                            v-model="form.note"
                            type="text"
                            ref="noteInput"
                            :disabled="saving"
                            @focus="noteSelected = true"
                            @blur="noteSelected = false"
                    />
            </resizable-textarea>
            <share-warning v-if="noteShared"/>
        </section>
        <section class="actions" :style="actionStyles">
            <button :disabled="saving"
                    @click="save"
                    class="doneBtn icon no-loading">
                <svg class="check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 13">
                    <path fill="#fff" d="M1.707 6.293A1 1 0 0 0 .293 7.707l5 5a1 1 0 0 0 1.414 0l11-11A1 1 0 1 0 16.293.293L6 10.586 1.707 6.293z"/>
                </svg>
                <span class="doneText">{{saving ? 'Saving...' : 'Done'}}</span>
            </button>
            <slot></slot>
        </section>
        <p class="error" v-if="error">{{error}}</p>

    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import { Prop, Watch } from "vue-property-decorator";
    import { FreeformFormData } from "@components/freeform/FreeformPromptTypes";
    import ResizableTextarea from "@components/ResizableTextarea.vue";
    import ShareWarning from "@components/promptcontent/ShareWarning.vue";
    import { debounce } from "debounce";
    import { getDeviceDimensions, isIosDevice } from "@web/DeviceUtil";
    import Logger from "@shared/Logger"

    const logger = new Logger("FreeformPromptForm");

    @Component({
        components: {
            ResizableTextarea,
            ShareWarning
        }
    })
    export default class FreeformPromptForm extends Vue {
        name = "FreeformPromptForm";

        @Prop({ type: String, required: false, default: null })
        title!: string | null;

        @Prop({ type: String, required: false, default: null })
        note!: string | null;

        @Prop({ type: Boolean, default: false })
        saving!: boolean;

        @Prop({ type: Boolean, default: false })
        noteShared!: boolean;

        @Prop({ type: String, default: null })
        error!: string | null;


        actionStyles: Record<string, string | number> = {};
        maxTextareaHeight = 250;
        debounceWindowSizeHandler: any;
        noteSelected = false;
        titleSelected = false;
        form: FreeformFormData = {
            title: "",
            note: ""
        }

        @Watch("title")
        onTitle(title: string | null) {
            this.form.title = title ?? "";
        }

        @Watch("note")
        onNote(note: string | null) {
            this.form.note = note ?? "";
        }

        @Watch("noteSelected")
        onNoteSelected() {
            this.onWidowSize()
        }

        @Watch("titleSelected")
        onTitleSelected() {
            this.onWidowSize()
        }

        beforeMount() {
            this.reset();
        }

        mounted() {
            this.onWidowSize();
            this.debounceWindowSizeHandler = debounce(this.onWidowSize, 100)
            window.addEventListener("resize", this.debounceWindowSizeHandler);
            window.visualViewport?.addEventListener("resize", this.debounceWindowSizeHandler)
        }


        onWidowSize() {
            this.maxTextareaHeight = getDeviceDimensions().height / 2;
            logger.info("set max text height to ", this.maxTextareaHeight);


            const noteOffset = 160;
            const titleOffset = 100;

            const useAdjustment = isIosDevice() && (this.noteSelected || this.titleSelected);
            const adjustmentValue = this.noteSelected ? noteOffset : titleOffset;

            const offset = useAdjustment ? adjustmentValue : 0;

            logger.info("Offset is", offset);
            let actionsHeight = 100;

            const top = getDeviceDimensions().height - actionsHeight + offset
            this.actionStyles = {
                ...this.actionStyles,
                top: `${ top }px`,
            }
        }

        reset() {
            this.form.title = this.title ?? ""
            this.form.note = this.note ?? "";
        }

        get hasChanges(): boolean {
            return this.form.title !== this.title || this.form.note !== this.note;

        }

        save() {
            this.$emit('save', this.form)
        }
    }
</script>

<style scoped lang="scss">
    @import "mixins";
    @import "forms";

    // This component should avoid having any styles specific to being a modal
    // We should assume this could be rendered in any type fo container - it's own page, a modal, whatever.
    // Apply any modal container styles in `ComposeModal.vue`.

    .freeform-form {
        display: flex;
        flex-direction: column;
        margin: 0 auto;
        max-width: 110rem;
        padding: 6.4rem 2.4rem;
        width: 100%;

        @include r(768) {
            height: 100%;
            justify-content: center;
            padding: 2.4rem;
        }
    }

    .titleInput {
        @include textInput;
        font-size: 2rem;
        font-weight: bold;

        @include r(600) {
            width: 66vw;
        }
        @include r(768) {
            font-size: 3rem;
        }
        @include r(960) {
            font-size: 3.8rem;
        }
    }

    .note {
        @include r(768) {
            margin-bottom: 3.2rem;
        }
    }

    textarea {
        @include textArea;
    }

    .actions {
        align-items: flex-end;
        bottom: 1.6rem;
        display: flex;
        justify-content: flex-end;
        position: absolute;
        right: 1.6rem;

        @include r(768) {
            justify-content: flex-start;
            min-width: 14rem;
            position: static;
        }
    }

    .doneBtn {
        padding: 1.6rem;

        @include r(768) {
            min-width: 14rem;
            padding: 1.2rem 1.6rem 1.6rem;
            width: auto;
        }

        .check {
            fill: $white;
            height: 1.8rem;
            width: 1.8rem;

            @include r(768) {
                display: none;
            }
        }

        &.icon .doneText {
            display: none;

            @include r(768) {
                display: inline;
            }
        }
    }
</style>