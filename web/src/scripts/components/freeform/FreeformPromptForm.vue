<template>
    <div class="freeform-form">
        <section class="title">
            <input type="text" placeholder="Title" v-model="form.title"/>
        </section>
        <section class="note">
            <resizable-textarea :max-height-px="maxTextareaHeight">
                    <textarea placeholder="Write something..."
                            v-model="form.note"
                            type="text"
                            ref="noteInput"
                            :disabled="saving"
                    />
            </resizable-textarea>
            <share-warning v-if="noteShared"/>
        </section>
        <section class="actions">
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

        maxTextareaHeight = 250;

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

        beforeMount() {
            this.reset();
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
    @import "forms";

    // This component should avoid having any styles specific to being a modal
    // We should assume this could be rendered in any type fo container - it's own page, a modal, whatever.
    // Apply any modal container styles in `ComposeModal.vue`.

    textarea {
        @include textArea;
    }

    input[type=text] {
        @include textInput;
    }

    .actions {
        display: flex;

        > *:not(.last-child) {
            margin-left: 1rem;
        }
    }

    .doneBtn {
        bottom: 2.4rem;
        padding: 1.6rem;
        position: absolute;
        right: 2.4rem;
        transition: opacity .3s, top .2s;

        @include r(768) {
            min-width: 14rem;
            padding: 1.2rem 1.6rem 1.6rem;
            position: static;
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