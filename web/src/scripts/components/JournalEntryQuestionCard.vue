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


        <h3 class="question">{{questionText}}</h3>
        <p v-show="!prompt && promptLoaded" class="warning prompt">
            Oops! We were unable to load the question for this day.
        </p>

        <div class="entry" v-if="!doReflect">{{responseText}}</div>

        <edit-reflection
                :show="doReflect"
                :responses="responses"
                :prompt="prompt"
                :responseMedium="responseMedium"
                @close="doReflect = false"
        />

        <nav v-show="!doReflect && responsesLoaded" class="buttonContainer">
            <a v-if="prompt && prompt.contentPath" :href="prompt.contentPath" class="secondary small button">
                Reflect
            </a>
        </nav>

    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import ReflectionPrompt from '@shared/models/ReflectionPrompt'
    import ReflectionResponse, {ResponseMedium} from "@shared/models/ReflectionResponse"
    import {getResponseText} from "@shared/util/StringUtil"
    import {formatDate} from "@shared/util/DateUtil"
    import SentPrompt from "@shared/models/SentPrompt"
    import DropdownMenu from "@components/DropdownMenu.vue";
    import EditReflection from "@components/ReflectionResponseTextEdit.vue"

    export default Vue.extend({
        components: {
            DropdownMenu,
            EditReflection,
        },
        created() {

        },
        props: {
            prompt: {
                type: Object as () => ReflectionPrompt,
                required: true,
            },
            sentPrompt: {
                type: Object as () => SentPrompt,
                required: true,
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
            editedText: string,
            editedResponses: { id: string | undefined, text: string }[],
            responseMedium: ResponseMedium,
        } {
            return {
                doReflect: false,
                editedText: "",
                editedResponses: [],
                responseMedium: ResponseMedium.JOURNAL_WEB,
            }
        },
        computed: {
            promptDate(): string | undefined {
                return formatDate(this.sentPrompt.firstSentAt, "LLL d, yyyy")
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
            responseText(): string | undefined {
                return getResponseText(this.responses);
            },
            questionText(): string | undefined {
                if (this.prompt) {
                    return this.prompt.question
                }

                if (this.responses.length > 0) {
                    return this.responses[0].promptQuestion;
                }
                return;
            }
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
