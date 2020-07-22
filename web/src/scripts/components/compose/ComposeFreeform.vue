<template>
    <div class="compose-container">
        <section class="title">
            <input type="text" placeholder="Title"/>
        </section>
        <section class="note">
            <resizable-textarea :max-height-px="maxTextareaHeight">
                    <textarea placeholder="Write something..."
                            v-model="editedNote"
                            type="text"
                            ref="noteInput"
                            :disabled="saving"
                    />
            </resizable-textarea>
        </section>
        <section class="actions">
            <button :disabled="saving"
                    class="no-loading secondary"
                    @click="cancel"
            >
                Cancel
            </button>

            <button :disabled="saving"
                    @click="save"
            >
                {{saving ? 'Saving...' : 'Save'}}
            </button>
            <p class="error" v-if="error">{{error}}</p>
        </section>

    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import ResizableTextarea from "@components/ResizableTextarea.vue";
    import ReflectionManager from "@web/managers/ReflectionManager";

    @Component({
        components: {
            ResizableTextarea
        }
    })
    export default class ComposeFreeform extends Vue {
        name = "ComposeFreeform";

        editedNote: string = ""
        maxTextareaHeight = 250;
        saving = false;
        error: string | null = null;

        async save() {
            this.saving = true;
            const saveResult = await ReflectionManager.shared.createFreeformReflection({
                title: "title",
                text: this.editedNote
            })
            this.saving = false;
            if (saveResult.success) {
                this.error = null;
            } else {
                this.error = saveResult.error ?? null;
            }
        }

        async cancel() {
            this.$emit('cancel')
        }
    }
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";
    @import "forms";

    // This component should avoid having any styles specific to being a modal
    // We should assume this could be rendered in any type fo container - it's own page, a modal, whatever.
    // Apply any modal container styles in `ComposeModal.vue`.
    .compose-container {

    }

    textarea {
        @include textArea;
    }

    input[type=text] {
        @include textInput;
    }
</style>