import {ResponseMedium} from '@shared/models/ReflectionResponse'
<template>
    <div>
        <div class="dateContainer menuParent">
            <div class="dates">
                <!-- <div class="doneStatus" v-show="responsesLoaded && (responses.length !== 0 || responseText)">Done</div> -->
                <p class="date">{{promptDate}}</p>
            </div>

            <dropdown-menu :items="linkItems"/>
        </div>

        <div v-if="error">
            <p v-show="error" class="warning prompt">
                {{error}}
            </p>
        </div>
        <div v-if="promptContent">

            <h3 class="topic" v-show="topicText">{{topicText}}</h3>
            <p class="subtext" v-show="subText">{{subText}}</p>
        </div>
        <div class="entry" v-if="!doReflect">{{responseText}}</div>
        <edit-reflection
                :show="doReflect"
                :responses="responses"
                :prompt="prompt"
                :responseMedium="responseMedium"
                @close="doReflect = false"
        />


        <nav v-show="!doReflect" class="buttonContainer">
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
    import {PageRoute} from "@web/PageRoutes"
    import PromptContentVue from "@components/PromptContent.vue"
    import SentPrompt from "@shared/models/SentPrompt"
    import {formatDate} from "@shared/util/DateUtil"
    import ReflectionResponse, {ResponseMedium} from "@shared/models/ReflectionResponse"
    import ReflectionPrompt from '@shared/models/ReflectionPrompt'
    import {getResponseText} from "@shared/util/StringUtil"
    import DropdownMenu from "@components/DropdownMenu.vue";
    import Modal from "@components/Modal.vue"
    import EditReflection from "@components/ReflectionResponseTextEdit.vue"

    export default Vue.extend({
        components: {
            Modal,
            DropdownMenu,
            PromptContent: PromptContentVue,
            EditReflection,
        },
        created() {
            this.promptContentUnsubscriber = PromptContentService.sharedInstance.observeByEntryId(this.entryId, {
                onData: (promptContent, error) => {
                    this.error = undefined;
                    if (error) {
                        console.error("JournalEntryPromptContentCard: Failed to get prompt content via subscriber", error);
                        this.promptContent = undefined;
                        this.error = "Unable to load the prompt";
                        this.loading = false;
                        return;
                    }

                    if (!promptContent) {
                        this.error = "Oops, we were unable to find the Prompt for this day."
                    } else {
                        this.promptContent = promptContent;
                    }
                    this.loading = false;
                }
            });
        },
        props: {
            entryId: {type: String, required: true},
            prompt: {type: Object as () => ReflectionPrompt},
            sentPrompt: {
                type: Object as () => SentPrompt
            },
            responses: {
                type: Array as () => ReflectionResponse[],
                required: false,
                default: [],
            },
            responsesLoaded: Boolean,
        },
        data(): {
            doReflect: boolean,
            promptContent: PromptContent | undefined,
            error: any | undefined,
            promptContentUnsubscriber: ListenerUnsubscriber | undefined,
            loading: boolean,
            showContent: boolean,
            editedText: string,
            editedResponses: { id: string | undefined, text: string }[],
            responseMedium: ResponseMedium,
        } {
            return {
                doReflect: false,
                promptContent: undefined,
                error: undefined,
                promptContentUnsubscriber: undefined,
                loading: true,
                showContent: false,
                editedText: "",
                editedResponses: [],
                responseMedium: ResponseMedium.JOURNAL_WEB,
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
            },
            promptContentPath(): string {
                return `${PageRoute.PROMPTS_ROOT}/${this.entryId}`
            },
            promptDate(): string | undefined {
                return formatDate(this.sentPrompt.firstSentAt, "LLL d, yyyy")
            },
            responseText(): string | undefined {
                return getResponseText(this.responses);
            },
            linkItems(): {
                title: string,
                href?: string,
                onClick?: () => void,
            }[] {
                const linkItems = [{
                    title: "Share Prompt",
                    onClick: () => {
                        alert("Clicked share")
                    }
                }];

                if (this.responses.length > 0) {
                    linkItems.push({
                        title: "Edit Reflection",
                        onClick: () => {
                            this.doReflect = true;
                        }
                    })
                } else {
                    linkItems.push({
                        title: "Add Reflection",
                        onClick: () => {
                            this.doReflect = true;
                        }
                    })
                }

                return linkItems
            },
        },
        methods: {
            // async doneEditing() {
            //     this.doReflect = false;
            //
            //
            //     const responsesById: { [id: string]: ReflectionResponse } = this.responses.reduce((map: { [id: string]: ReflectionResponse }, response) => {
            //         if (response.id) {
            //             map[response.id as string] = response;
            //         }
            //         return map;
            //     }, {});
            //
            //     const tasks: Promise<any>[] = [];
            //     this.editedResponses.forEach(edit => {
            //         return new Promise(async resolve => {
            //             let response = edit.id ? responsesById[edit.id] : undefined;
            //             if (!response && this.prompt && this.prompt.id) {
            //                 response = await ReflectionResponseService.createReflectionResponse(this.prompt.id, ResponseMedium.JOURNAL_WEB, this.prompt.question)
            //             }
            //
            //             if (edit.text && edit.text.trim() && response) {
            //                 response.content.text = edit.text;
            //                 //saving will trigger a refresh of the data elsewhere, so we shouldn't need to update anything here;
            //                 await ReflectionResponseService.sharedInstance.save(response);
            //             } else if (response && response.id) {
            //                 //the text was deleted, delete the response;
            //                 await ReflectionResponseService.sharedInstance.delete(response);
            //             } else {
            //                 console.error("There was no response available to save... this shouldn't happen");
            //             }
            //             resolve();
            //         })
            //     });
            //     await Promise.all(tasks);
            //
            // },
            // cancelEditing() {
            //     const responsesById: { [id: string]: ReflectionResponse } = this.responses.reduce((map: { [id: string]: ReflectionResponse }, response) => {
            //         if (response.id) {
            //             map[response.id as string] = response;
            //         }
            //         return map;
            //     }, {});
            //
            //     const foundChange = this.editedResponses.find(edit => {
            //         if (!edit.id && edit.text.trim()) {
            //             return true;
            //         } else if (edit.id && responsesById[edit.id]) {
            //             const response = responsesById[edit.id];
            //             const existingText = response.content.text || "";
            //             return existingText.trim() !== edit.text.trim();
            //         }
            //         return false;
            //     });
            //
            //     if (foundChange) {
            //         const c = confirm("You have unsaved changes. Are you sure you want to cancel?");
            //         if (c) {
            //             console.log("confirmed cancel");
            //             // this.editedText = this.responseText;
            //             this.doReflect = false;
            //         } else {
            //             console.log("don't cancel");
            //         }
            //     } else {
            //         console.log("no changes, just closing");
            //         this.doReflect = false;
            //     }
            // },
            // async deleteSentPrompt() {
            //
            //     const c = confirm("Are you sure you want to ignore this question? It will no longer be available in your journal");
            //     if (!c) {
            //         return;
            //     }
            //
            //     if (this.prompt && this.prompt.id) {
            //         await SentPromptService.sharedInstance.deleteForPromptId(this.prompt.id)
            //     }
            // },
            // startEditing() {
            //     this.editedText = this.responseText || "";
            //     this.editedResponses = this.responses.map(response => {
            //         return {id: response.id || "", text: response.content.text || ""}
            //     });
            //
            //     if (this.editedResponses.length === 0) {
            //         this.editedResponses = [{id: undefined, text: ""}];
            //     }
            //
            //
            //     this.doReflect = true;
            // },
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

    .dateContainer {
        align-items: center;
        display: flex;
        justify-content: space-between;
        margin-bottom: 1.6rem;
        position: relative;

        .date {
            font-size: 1.6rem;
            flex-grow: 1;
            opacity: .8;
            display: flex;

            &.edited {
                color: $lightText;
                font-size: 1rem;
            }
        }
    }


</style>
