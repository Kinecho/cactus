<template>
    <article class="journalEntry" id="reflectParent" v-bind:class="{ new: !responseText }">
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
    import {clickOutsideDirective} from '@web/vueDirectives'
    import Modal from "@components/Modal.vue";
    import PromptContent from "@components/PromptContent.vue"
    import {getResponseText} from '@shared/util/StringUtil'
    import PromptContentEntryCard from "@components/JournalEntryPromptContentCard.vue";
    import PromptQuestionEntryCard from "@components/JournalEntryQuestionCard.vue";
    import DropdownMenu from "@components/DropdownMenu.vue";


    import Spinner from "@components/Spinner.vue";

    declare interface ReflectionResponseCardData {
        doReflect: boolean,
        menuOpen: boolean,
        deleting: boolean,
        prompt?: ReflectionPrompt,
        editedText: string,
        responses: ReflectionResponse[],
        promptUnsubscriber?: ListenerUnsubscriber,
        responseUnsubscriber?: ListenerUnsubscriber,
        responsesLoaded: boolean,
        promptLoaded: boolean,
        editedResponses: { id: string | undefined, text: string }[],
        showContent: boolean,
    }

    export default Vue.extend({
        components: {
            Modal,
            PromptContent,
            Spinner,
            "prompt-content": PromptContentEntryCard,
            "question-content": PromptQuestionEntryCard,
            DropdownMenu,
        },
        directives: {
            'click-outside': clickOutsideDirective(),
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
                doReflect: false,
                editedText: "",
                menuOpen: false,
                deleting: false,
                responses: [],
                prompt: undefined,
                promptUnsubscriber: undefined,
                responsesLoaded: false,
                responseUnsubscriber: undefined,
                promptLoaded: false,
                editedResponses: [],
                showContent: false,
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

            // promptDate(): string | undefined {
            //     return DateUtil.formatDate(this.sentPrompt.firstSentAt, "LLL d, yyyy")
            // },
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
            // toggleMenu() {
            //     this.menuOpen = !this.menuOpen;
            // },
            // closeMenu() {
            //     this.menuOpen = false;
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
            //     this.menuOpen = false;
            // },
        }
    })

</script>

<style scoped lang="scss">
    @import "~@styles/mixins";
    @import "~@styles/variables";
    @import "~@styles/common";
    @import "~@styles/modal";
    @import "~styles/transitions";

    .centered {
        text-align: left;
    }

    .doneStatus {
        background-color: $lightPink;
        border-radius: 2rem;
        color: $darkestPink;
        display: inline-block;
        font-size: 1.4rem;
        font-weight: bold;
        letter-spacing: 1px;
        margin-bottom: 2.4rem;
        padding: 0 .8rem;
        text-transform: uppercase;
    }

    button, a.button {
        align-items: center;
        display: inline-flex;
        flex-grow: 0;
        margin-right: .8rem;

        svg {
            fill: $darkGreen;
            height: 1.6rem;
            margin-right: .8rem;
            width: 1.6rem;
        }

        &.icon {
            padding: .9rem;

            svg {
                margin-right: 0;
            }
        }

        &.primary svg {
            fill: white;
        }
    }

    //.dateContainer {
    //    align-items: center;
    //    display: flex;
    //    justify-content: space-between;
    //    margin-bottom: 1.6rem;
    //    position: relative;
    //
    //    .date {
    //        font-size: 1.6rem;
    //        flex-grow: 1;
    //        opacity: .8;
    //        display: flex;
    //
    //        &.edited {
    //            color: $lightText;
    //            font-size: 1rem;
    //        }
    //    }
    //}

    //.moreMenu {
    //    background-color: $lightPink;
    //    border-radius: 6px;
    //    right: 0;
    //    padding: .8rem 0;
    //    position: absolute;
    //    top: 4rem;
    //
    //    a {
    //        background-color: transparent;
    //        color: $darkestPink;
    //        display: block;
    //        font-size: 1.6rem;
    //        opacity: .8;
    //        padding: .8rem 2.4rem;
    //        text-decoration: none;
    //        transition: opacity .2s ease-in-out, background-color .2s ease-in-out;
    //
    //        &:hover {
    //            background-color: lighten($lightPink, 2%);
    //            opacity: 1;
    //        }
    //    }
    //}

    .topic,
    .question,
    .subtext {
        max-width: 66%;
    }

    .topic {
        margin-bottom: .8rem;
    }

    .question {
        margin-bottom: 1.6rem;
        white-space: pre-line;
    }

    .journalEntry {
        background-color: white;
        border: 1px solid $lightest;
        border-radius: 12px;
        margin: 0 .8rem 2.4rem;
        padding: 2.4rem 1.6rem;
        overflow: hidden;
        position: relative;

        @include r(768) {
            border-radius: 12px;
            padding: 3.2rem 2.4rem;
        }

        @include r(768) {
            margin: 0 auto 4.8rem;
            max-width: 64rem;
            padding: 3.2rem;
        }

        &.new {
            @include shadowbox;
            border: 0;
        }

        // url(assets/images/maroonTriangleBlob.svg) left -56px bottom -28px/260px,
        // url(assets/images/yellowNeedleBlob.svg) right -216px bottom -180px/480px,
        // url(assets/images/pinkBlob.svg) left -56px bottom -11px/180px,
        // url(assets/images/lightGreenBlob.svg) right -56px bottom -11px/180px,
        // url(assets/images/yellowBlob.svg) left -56px bottom -11px/180px;

        &:nth-child(1) {
            background: url(assets/images/maroonTriangleBlob.svg) right -130px bottom -52px/260px no-repeat;
        }
    }

    .backgroundImage {
        bottom: -2.4rem;
        height: auto;
        left: 60%;
        position: absolute;
        width: 60%;
    }

    .entry {
        padding-left: 2rem;
        position: relative;
        white-space: pre-line;

        &:before {
            background-color: $yellow;
            border-radius: .4rem;
            content: '';
            display: block;
            height: 100%;
            left: 0;
            position: absolute;
            top: 0;
            width: .4rem;
        }
    }

    textarea {
        border: 1px solid $green;
        border-radius: 6px;
        font-family: $font-stack;
        font-size: 1.6rem;
        line-height: 1.43;
        margin-top: .8rem;
        min-height: 11rem;
        padding: 1.6rem;
        width: 100%;
    }

    .buttonContainer {
        display: flex;
        margin-top: 1.6rem;
    }

    .warning {
        &.response {
            background-color: $darkestYellow;
        }

        &.prompt {
            background-color: #7A3814;
        }

        padding: 1rem;
        color: white;
        margin: 1rem 0;
        border-radius: .5rem;
    }

    .secondary {
        margin-right: .8rem;
        transition: all .2s ease;
        outline: transparent none;

        &.open {
            transform: rotate(90deg);
            transform-origin: center;
        }

        &:hover {
            svg {
                fill: $darkestGreen;
            }
        }
    }

    .wiggle:hover svg {
        animation: wiggle .5s forwards;
    }

</style>
