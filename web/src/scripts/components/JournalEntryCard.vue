<template>
    <div v-if="bodyComponent">
        <component v-bind:is="bodyComponent.name" v-bind="bodyComponent.props"></component>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue'
    import PromptContentEntryCard from "@components/JournalEntryPromptContentCard.vue";
    import PromptQuestionEntryCard from "@components/JournalEntryQuestionCard.vue";
    import Spinner from "@components/Spinner.vue";
    import SkeletonEntry from "@components/JournalEntrySkeleton.vue";
    import JournalEntry from '@web/datasource/models/JournalEntry'


    export default Vue.extend({
        components: {
            Spinner,
            "prompt-content": PromptContentEntryCard,
            "question-content": PromptQuestionEntryCard,
            SkeletonEntry,
        },
        props: {
            journalEntry: {
                type: Object as () => JournalEntry,
                required: true
            }
        },
        data(): {entry: JournalEntry} {
            return {
                entry: this.journalEntry
            }
        },

        computed: {
            bodyComponent(): { name: string, props?: any } | undefined {
                const entry: JournalEntry = this.entry;
                console.log("updating body component with journal entry stuffs");
                if (!entry.allLoaded) {
                    return {name: "skeleton-entry"};
                } else if (entry.promptContent) {
                    return {
                        name: "prompt-content",
                        props: {
                            entry: entry,
                            entryId: entry.promptContent.entryId,
                            content: entry.promptContent.content,
                        }
                    };
                } else if (entry.prompt) {
                    return {
                        name: "question-content",
                        props: {
                            prompt: entry.prompt,
                            sentPrompt: entry.sentPrompt,
                            responses: entry.responses,
                            entry: entry,
                            responsesLoaded: entry.responsesLoaded,
                        }
                    };
                }
            },
        },
        methods: {}
    })

</script>

<style scoped lang="scss">
    @import "mixins";
    @import "variables";

</style>
