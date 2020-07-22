<template>
    <freeform-prompt-form
            :title="null"
            :note="null"
            :saving="saving"
            :error="error"
            @save="save"
    />
    <!--    <div class="compose-container">-->
    <!--        <section class="title">-->
    <!--            <input type="text" placeholder="Title" v-model="form.title"/>-->
    <!--        </section>-->
    <!--        <section class="note">-->
    <!--            <resizable-textarea :max-height-px="maxTextareaHeight">-->
    <!--                    <textarea placeholder="Write something..."-->
    <!--                            v-model="form.note"-->
    <!--                            type="text"-->
    <!--                            ref="noteInput"-->
    <!--                            :disabled="saving"-->
    <!--                    />-->
    <!--            </resizable-textarea>-->
    <!--        </section>-->
    <!--        <section class="actions">-->
    <!--            <button :disabled="saving"-->
    <!--                    @click="save"-->
    <!--                    class="doneBtn icon no-loading">-->
    <!--                <svg class="check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 13">-->
    <!--                    <path fill="#fff" d="M1.707 6.293A1 1 0 0 0 .293 7.707l5 5a1 1 0 0 0 1.414 0l11-11A1 1 0 1 0 16.293.293L6 10.586 1.707 6.293z"/>-->
    <!--                </svg>-->
    <!--                <span class="doneText">{{saving ? 'Saving...' : 'Done'}}</span>-->
    <!--            </button>-->
    <!--            <p class="error" v-if="error">{{error}}</p>-->
    <!--        </section>-->

    <!--    </div>-->
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import ResizableTextarea from "@components/ResizableTextarea.vue";
    import ReflectionManager from "@web/managers/ReflectionManager";
    import CactusMember from "@shared/models/CactusMember";
    import { Prop } from "vue-property-decorator";
    import FreeformPromptForm from "@components/freeform/FreeformPromptForm.vue";
    import { FreeformFormData } from "@components/freeform/FreeformPromptTypes";

    @Component({
        components: {
            FreeformPromptForm,
            ResizableTextarea
        }
    })
    export default class ComposeFreeform extends Vue {
        name = "ComposeFreeform";

        @Prop({ type: Object as () => CactusMember, required: true })
        member!: CactusMember

        maxTextareaHeight = 250;
        saving = false;
        error: string | null = null;
        startTime = Date.now()

        beforeMount() {
            this.startTime = Date.now()
        }

        async save(form: FreeformFormData) {
            this.saving = true;
            const duration = Date.now() - this.startTime;
            const saveResult = await ReflectionManager.shared.createFreeformReflection({
                title: form.title,
                note: form.note,
                member: this.member,
                duration,
            })


            this.saving = false;
            if (saveResult.success) {
                this.error = null;
            } else {
                this.error = saveResult.error ?? null;
            }
            this.close();
        }

        close() {
            this.$emit("close")
        }

        async cancel() {
            this.close();
        }
    }
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";

    // This component should avoid having any styles specific to being a modal
    // We should assume this could be rendered in any type fo container - it's own page, a modal, whatever.
    // Apply any modal container styles in `ComposeModal.vue`.

</style>