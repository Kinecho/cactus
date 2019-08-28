<template>
    <div>
        <div v-if="error">
            <p v-show="error" class="warning prompt">
                {{error}}
            </p>
        </div>
        <div v-if="promptContent">

            <h3 class="topic" v-show="topicText">{{topicText}}</h3>
            <p class="subtext" v-show="subText">{{subText}}</p>
        </div>
        <nav v-show="!doReflect && responsesLoaded" class="buttonContainer">
            <a :href="promptContentPath" @click.prevent="showContent = true" class="button">Reflect</a>
        </nav>
        <modal v-if:show="showContent" v-on:close="showContent = false" :showCloseButton="true">
            <PromptContent slot="body" v-bind:promptContentEntryId="entryId" v-on:close="showContent = false"/>
        </modal>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import PromptContent, {Content} from "@shared/models/PromptContent"
    import {ListenerUnsubscriber} from '@web/services/FirestoreService'
    import PromptContentService from '@web/services/PromptContentService'

    export default Vue.extend({
        created() {
            if (this.entryId) {
                this.promptContentUnsubscriber = PromptContentService.sharedInstance.observeByEntryId(this.entryId, {
                    onData: (promptContent, error) => {
                        this.error = undefined;
                        if (error) {
                            console.error("JournalEntryPromptContentCard: Failed to get prompt content via subscriber", error)
                            this.promptContent = undefined;
                            this.error = "Unable to load the prompt";
                            this.loading = false;
                            return;
                        }

                        if (!promptContent) {
                            this.error = "Oops, we were unable to find the Prompt for this day."
                        }

                        this.promptContent = promptContent;
                        this.loading = false;
                    }
                });
            }
        },
        props: {
            entryId: String,
            doReflect: Boolean,
        },
        data(): {
            promptContent: PromptContent | undefined,
            error: any | undefined,
            promptContentUnsubscriber: ListenerUnsubscriber | undefined,
            loading: boolean,
            showContent: boolean,
        } {
            return {
                promptContent: undefined,
                error: undefined,
                promptContentUnsubscriber: undefined,
                loading: true,
                showContent: false,
            }
        },
        computed: {
            topicText(): string | undefined {
                return this.promptContent && this.promptContent.subjectLine;
            },
            subText(): string | undefined {
                if (!this.promptContent) {
                    return;
                }

                const [first]: Content[] = (this.promptContent && this.promptContent.content) || [];
                return first && first.text
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .topic,
    .subtext {
        max-width: 66%;
    }

    .topic {
        margin-bottom: .8rem;
    }


</style>
