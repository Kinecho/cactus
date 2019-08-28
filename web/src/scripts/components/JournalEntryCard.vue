<template>
    <article class="journalEntry">
        <div v-if="bodyComponent">
            <component v-bind:is="bodyComponent.name" v-bind="bodyComponent.props"></component>
        </div>
    </article>
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

    declare interface ReflectionResponseCardData {
        prompt?: ReflectionPrompt,
        responses: ReflectionResponse[],
        promptUnsubscriber?: ListenerUnsubscriber,
        responseUnsubscriber?: ListenerUnsubscriber,
        responsesLoaded: boolean,
        promptLoaded: boolean,
    }

    export default Vue.extend({
        components: {
            Spinner,
            "prompt-content": PromptContentEntryCard,
            "question-content": PromptQuestionEntryCard,
        },
        props: {
            sentPrompt: {
                type: Object as () => SentPrompt,
                required: true
            }
        },
        created() {
            const sentPrompt = this.sentPrompt;
            const promptId = sentPrompt.promptId;
            if (promptId) {
                this.promptUnsubscriber = ReflectionPromptService.sharedInstance.observeById(promptId, {
                    includeDeleted: false,
                    onData: prompt => {
                        this.prompt = prompt;
                        this.promptLoaded = true;
                    }
                });

                this.responseUnsubscriber = ReflectionResponseService.sharedInstance.observeForPromptId(promptId, {
                    onData: responses => {
                        this.responses = responses;
                        this.responsesLoaded = true;
                    }
                })
            } else {
                console.log("NO prompt id found on the sent prompt");
            }
        },

        destroyed() {
            if (this.promptUnsubscriber) {
                this.promptUnsubscriber();
            }
            if (this.responseUnsubscriber) {
                this.responseUnsubscriber();
            }
        },
        data(): ReflectionResponseCardData {
            return {
                promptUnsubscriber: undefined,
                responseUnsubscriber: undefined,
                prompt: undefined,
                responses: [],
                responsesLoaded: false,
                promptLoaded: false,
            }
        },
        watch: {},
        computed: {
            bodyComponent(): { name: string, props?: any } | undefined {
                if (!this.promptLoaded) {
                    return {name: "spinner"};
                } else if (this.prompt && this.prompt.promptContentEntryId) {
                    return {
                        name: "prompt-content",
                        props: {
                            sentPrompt: this.sentPrompt,
                            prompt: this.prompt,
                            entryId: this.prompt.promptContentEntryId,
                            responses: this.responses,
                            responsesLoaded: this.responsesLoaded,
                        }
                    };
                } else if (this.prompt) {
                    return {
                        name: "question-content",
                        props: {
                            prompt: this.prompt,
                            sentPrompt: this.sentPrompt,
                            responses: this.responses,
                            responsesLoaded: this.responsesLoaded,
                        }
                    };
                }
            },
        },
        methods: {}
    })

</script>

<style scoped lang="scss">
    @import "~@styles/mixins";
    @import "~@styles/variables";


</style>
