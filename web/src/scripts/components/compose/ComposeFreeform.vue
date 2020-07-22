<template>
    <div class="compose-container">
        <h1>Freeform compose</h1>
        <p>
            Enter whatever you want.
        </p>
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
                    class="no-loading"
                    @click="cancel"
            >
                Cancel
            </button>

            <button :disabled="saving"
                    @click="save"
            >
                {{saving ? "Saving..." : "Save"}}
            </button>
            <p v-if="saving">Not actually saving...</p>
        </section>

    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import ResizableTextarea from "@components/ResizableTextarea.vue";

    @Component({
        components: {
            ResizableTextarea
        }
    })
    export default class ComposeFreeform extends Vue {
        name = "ComposeFreeform";

        editedNote: string = ""
        maxTextareaHeight = 200;
        saving = false;

        async save() {
            this.saving = true;

            window.setTimeout(() => {
                this.saving = false
            }, 1200);
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
</style>