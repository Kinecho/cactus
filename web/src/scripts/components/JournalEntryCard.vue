<template>
    <div v-if="bodyComponent">
        <component v-bind:is="bodyComponent.name" v-bind="bodyComponent.props"></component>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue'
    import ReflectionResponse from '@shared/models/ReflectionResponse'
    import ReflectionResponseService from '@web/services/ReflectionResponseService'
    import SentPrompt from "@shared/models/SentPrompt"
    import {ListenerUnsubscriber} from "@web/services/FirestoreService"
    import ReflectionPromptService from "@web/services/ReflectionPromptService"
    import ReflectionPrompt from "@shared/models/ReflectionPrompt"
    import PromptContentEntryCard from "@components/JournalEntryPromptContentCard.vue";
    import PromptQuestionEntryCard from "@components/JournalEntryQuestionCard.vue";
    import Spinner from "@components/Spinner.vue";
    import SkeletonEntry from "@components/JournalEntrySkeleton.vue";
    import JournalEntry from '@web/datasource/models/JournalEntry'

    declare interface ReflectionResponseCardData {
        // prompt?: ReflectionPrompt,
        // responses: ReflectionResponse[],
        // promptUnsubscriber?: ListenerUnsubscriber,
        // responseUnsubscriber?: ListenerUnsubscriber,
        // responsesLoaded: boolean,
        // promptLoaded: boolean,
    }

    export default Vue.extend({
        components: {
            Spinner,
            "prompt-content": PromptContentEntryCard,
            "question-content": PromptQuestionEntryCard,
            SkeletonEntry,
        },
        props: {
            // sentPrompt: {
            //     type: Object as () => SentPrompt,
            //     required: true
            // },
            journalEntry: {
                type: Object as () => JournalEntry,
                required: true
            }
        },
        // created() {
        //     const sentPrompt = this.sentPrompt;
        //     const promptId = sentPrompt.promptId;
        //     if (promptId) {
        //         this.promptUnsubscriber = ReflectionPromptService.sharedInstance.observeById(promptId, {
        //             includeDeleted: false,
        //             onData: prompt => {
        //                 this.prompt = prompt;
        //                 this.promptLoaded = true;
        //                 this.$emit('loaded')
        //             }
        //         });
        //
        //         this.responseUnsubscriber = ReflectionResponseService.sharedInstance.observeForPromptId(promptId, {
        //             onData: responses => {
        //                 this.responses = responses;
        //                 this.responsesLoaded = true;
        //                 this.$emit('loaded')
        //             }
        //         })
        //     } else {
        //         console.log("NO prompt id found on the sent prompt");
        //     }
        // },
        beforeMount() {

        },
        destroyed() {
            // if (this.promptUnsubscriber) {
            //     this.promptUnsubscriber();
            // }
            // if (this.responseUnsubscriber) {
            //     this.responseUnsubscriber();
            // }
        },
        data(): ReflectionResponseCardData {
            return {
                // promptUnsubscriber: undefined,
                // responseUnsubscriber: undefined,
                // prompt: undefined,
                // responses: [],
                // responsesLoaded: false,
                // promptLoaded: false,
            }
        },
        watch: {},
        computed: {
            bodyComponent(): { name: string, props?: any } | undefined {
                const entry: JournalEntry = this.journalEntry;
                const sentPrompt = entry.sentPrompt;


                if (!entry.allLoaded) {
                    return {name: "skeleton-entry"};
                } else if (entry.promptContent) {
                    return {
                        name: "prompt-content",
                        props: {
                            sentPrompt: sentPrompt,
                            prompt: entry.prompt,
                            entryId: entry.promptContent.entryId,
                            promptContent: entry.promptContent,
                            responses: entry.responses,
                            responsesLoaded: entry.responsesLoaded,
                        }
                    };
                } else if (entry.prompt) {
                    return {
                        name: "question-content",
                        props: {
                            prompt: entry.prompt,
                            sentPrompt: entry.sentPrompt,
                            responses: entry.responses,
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
