<template>
    <freeform-prompt-form
            :title="null"
            :note="null"
            :saving="saving"
            :error="error"
            @save="save"
    />

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
    import ReflectionPrompt from "@shared/models/ReflectionPrompt";
    import ReflectionResponse from "@shared/models/ReflectionResponse";
    import { FreeFormSaveEvent } from "@web/managers/ReflectionManagerTypes";


    function isError(input: any): input is { error: string } {
        return !!(input as { error: string }).error;
    }

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

        @Prop({ type: Object as () => ReflectionPrompt, required: false, default: null })
        prompt!: ReflectionPrompt | null;

        @Prop({ type: Object as () => ReflectionResponse, required: false, default: null })
        reflection!: ReflectionResponse | null;

        saving = false;
        error: string | null = null;
        startTime: number | null = null;

        beforeMount() {
            this.startTime = Date.now()
        }

        get isEdit(): boolean {
            return !!this.prompt && !!this.reflection
        }

        getDuration(): number {
            return this.startTime ? Date.now() - this.startTime : 0;
        }

        async save(form: FreeformFormData) {
            this.saving = true;
            let saveEvent: FreeFormSaveEvent | { error: string };
            if (this.isEdit) {
                saveEvent = await this.updateExisting(form)
            } else {
                saveEvent = await this.saveNew(form)
            }
            this.saving = false
            // this.close();

            if (isError(saveEvent)) {
                this.error = saveEvent.error
            } else {
                this.error = null;
                this.$emit("saved", saveEvent)
            }
        }

        async saveNew(form: FreeformFormData): Promise<FreeFormSaveEvent | { error: string }> {
            this.saving = true;
            const duration = this.getDuration();
            const saveResult = await ReflectionManager.shared.createFreeformReflection({
                ...form,
                member: this.member,
                duration,
            })

            if (!saveResult.success) {
                return { error: saveResult.error }
            }

            return {
                prompt: saveResult.prompt,
                reflectionResponse: saveResult.reflectionResponse,
                created: true,
            }
        }

        async updateExisting(form: FreeformFormData): Promise<FreeFormSaveEvent | { error: string }> {
            if (!this.reflection || !this.prompt) {
                return { error: "Oops, we were unable to save your note. Please try again later." };
            }

            const saveResult = await ReflectionManager.shared.updateFreeformReflection({
                reflection: this.reflection,
                prompt: this.prompt,
                member: this.member,
                duration: this.getDuration(),
                ...form
            })

            if (!saveResult.success) {
                return { error: saveResult.error };
            }
            return {
                reflectionResponse: this.reflection,
                prompt: this.prompt,
                created: false,
            }
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