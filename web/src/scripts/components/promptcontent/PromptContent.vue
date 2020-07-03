<template>
    <div>
        <progress-stepper :total="totalPages" :current="contentIndex" />
        <p>EntryId: {{promptContent.entryId || 'not set'}}</p>
        <p>PromptId: {{prompt.id || 'not set'}}</p>
        <p>Prompt Content Subject Line: {{promptContent.subjectLine}}</p>

        <p>Responses: {{responses !== null ? responses.length : 'not loaded'}}</p>
        <p>PromptType: {{prompt.promptType}}</p>

        <p>Current Content Index: {{contentIndex}}</p>
        <p>Total Pages {{totalPages}}</p>

        <button class="button" @click="$emit('previous')">Previous</button>
        <button class="button" @click="$emit('next')">Next</button>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import PromptContent from "@shared/models/PromptContent";
    import { Prop } from "vue-property-decorator";
    import ReflectionPrompt from "@shared/models/ReflectionPrompt";
    import ReflectionResponse from "@shared/models/ReflectionResponse";
    import ProgressStepper from "@components/ProgressStepper.vue";

    @Component({
        components: {
            ProgressStepper,
        }
    })
    export default class Prompt extends Vue {
        name = "PromptContent.vue";

        @Prop({ type: Object as PromptContent, required: true })
        promptContent!: PromptContent

        @Prop({ type: Object as ReflectionPrompt, required: true })
        prompt!: ReflectionPrompt;

        @Prop({ type: Array as () => ReflectionResponse[], required: false, default: null })
        responses!: ReflectionResponse[] | null;

        /**
         * Zero-based index of the current card to show
         */
        @Prop({ type: Number, required: false, default: 0 })
        index!: number;

        /**
         * Ensure the index is within the bounds of the content array
         * @return {number}
         */
        get contentIndex(): number {
            return Math.min(Math.max(this.index, 0), this.promptContent.content.length - 1);
        }

        get totalPages(): number {
            return this.promptContent.content.length;
        }
    }
</script>

<style scoped lang="scss">

</style>