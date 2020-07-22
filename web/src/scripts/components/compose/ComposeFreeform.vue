<template>
    <div class="compose-container">
        <section class="title">
            <input type="text" placeholder="Enter a title"/>
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

    // This component should avoid having any styles specific to being a modal
    // We should assume this could be rendered in any type fo container - it's own page, a modal, whatever.
    // Apply any modal container styles in `ComposeModal.vue`.
    .compose-container {

    }

    textarea, input[type=text] {
        font-family: $font-stack;
        background: transparent;
        border: 0;
        color: $darkestGreen;
        font-size: 1.8rem;
        line-height: 1.4;
        margin: 0 0 3.2rem 0;
        opacity: .8;
        padding: .8rem;
        width: 100%;
        resize: none;
        @include r(374) {
            font-size: 2rem;
        }
        @include r(768) {
            font-size: 2.4rem;
            margin: -1.6rem 0 3.2rem -1.6rem;
            padding: 1.6rem;
        }
        @include r(960) {
            font-size: 3.2rem;
        }

        &:focus {
            outline-color: rgba(0, 0, 0, .3);
        }
    }
</style>