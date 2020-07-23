<template>
    <div class="compose-container">

        <transition-group :name="transitionName" mode="in-out" tag="div" class="transition-container">
            <div v-if="!showInsights"
                    :key="`prompt-form`" class="slide-card">
                <freeform-prompt-form
                        :title="title"
                        :note="note"
                        :saving="saving"
                        :error="error"
                        :note-shared="noteShared"
                        @save="save"
                >
                    <button class="secondary" @click="showInsights = !showInsights" v-if="showInsightsButton">
                        Show Insights
                    </button>
                </freeform-prompt-form>

            </div>
            <div :key="`insights`" v-if="showInsights" class="slide-card">
                <freeform-insights :reflection="reflection"/>
                <button class="secondary" @click="showInsights = !showInsights">Back</button>
            </div>
        </transition-group>
    </div>
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
    import FreeformInsights from "@components/freeform/FreeformInsights.vue";


    function isError(input: any): input is { error: string } {
        return !!(input as { error: string }).error;
    }

    @Component({
        components: {
            FreeformInsights,
            FreeformPromptForm,
            ResizableTextarea
        }
    })
    export default class ComposeFreeformNote extends Vue {
        name = "ComposeFreeformNote";

        @Prop({ type: Object as () => CactusMember, required: true })
        member!: CactusMember

        @Prop({ type: Object as () => ReflectionPrompt, required: false, default: null })
        prompt!: ReflectionPrompt | null;

        @Prop({ type: Object as () => ReflectionResponse, required: false, default: null })
        reflection!: ReflectionResponse | null;

        showInsights = false;
        saving = false;
        error: string | null = null;
        startTime: number | null = null;

        beforeMount() {
            this.startTime = Date.now()
        }

        get showInsightsButton(): boolean {
            return !!this.reflection
        }

        get transitionName(): string {
            return this.showInsights ? "slide-left-absolute" : "slide-right-absolute";
        }

        get note(): string | null {
            return this.reflection?.content.text ?? null;
        }

        get title(): string | null {
            return this.prompt?.question ?? null;
        }

        get isEdit(): boolean {
            return !!this.prompt && !!this.reflection
        }

        get noteShared(): boolean {
            return this.reflection?.shared ?? false;
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
                this.$emit("saved", saveEvent);
                this.showInsights = true;
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
    @import "transitions";
    // This component should avoid having any styles specific to being a modal
    // We should assume this could be rendered in any type fo container - it's own page, a modal, whatever.
    // Apply any modal container styles in `ComposeModal.vue`.

    .compose-container {
        position: relative;
        width: 100%;
        height: 100%;
        justify-content: center;
        align-items: center;

        .transition-container {
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .slide-card {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            width: 100%;
        }
    }

</style>