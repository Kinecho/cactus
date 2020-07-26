<template>
    <div v-if="bodyComponent && bodyComponent.name">
        <component v-bind:is="bodyComponent.name" v-bind="bodyComponent.props"></component>
    </div>
    <div v-else></div>
</template>

<script lang="ts">
    import Vue from 'vue'
    import PromptContentEntryCard from "@components/JournalEntryPromptContentCard.vue";
    import PromptQuestionEntryCard from "@components/JournalEntryQuestionCard.vue";
    import Spinner from "@components/Spinner.vue";
    import SkeletonEntry from "@components/JournalEntrySkeleton.vue";
    import JournalEntry from '@web/datasource/models/JournalEntry'
    import Logger from "@shared/Logger";
    import CactusMember from "@shared/models/CactusMember";
    import JournalEntryFreeformCard from "@components/JournalEntryFreeformCard.vue";
    import { PromptType } from "@shared/models/ReflectionPrompt";

    const logger = new Logger("JournalEntryCard");
    export default Vue.extend({
        components: {
            Spinner,
            "prompt-content": PromptContentEntryCard,
            "question-content": PromptQuestionEntryCard,
            "freeform-card": JournalEntryFreeformCard,
            SkeletonEntry,
        },
        props: {
            journalEntry: {
                type: Object as () => JournalEntry,
                required: true
            },
            member: Object as () => CactusMember,
        },
        data(): { entry: JournalEntry } {
            return {
                entry: this.journalEntry
            }
        },

        computed: {
            bodyComponent(): { name: string, props?: any } | undefined {
                const entry: JournalEntry = this.entry;
                if (!entry.allLoaded) {
                    return { name: "skeleton-entry" };
                } else if (entry.promptContent) {
                    return {
                        name: "prompt-content",
                        props: {
                            entry: entry,
                            member: this.member,
                            entryId: entry.promptContent.entryId,
                            content: entry.promptContent.content,
                        }
                    };
                } else if (entry.prompt?.promptType === PromptType.FREE_FORM) {
                    return {
                        name: "freeform-card",
                        props: { entry, member: this.member }
                    }
                } else if (entry.prompt) {
                    return {
                        name: "question-content",
                        props: {
                            prompt: entry.prompt,
                            sentPrompt: entry.sentPrompt,
                            responses: entry.responses,
                            member: this.member,
                            entry: entry,
                            responsesLoaded: entry.responsesLoaded,
                        }
                    };
                } else {
                    logger.info("No entry.prompt found", entry)
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
