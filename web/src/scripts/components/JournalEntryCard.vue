<template>

    <article class="journalEntry" id="reflectParent" v-bind:class="{ new: !responseText }">

        <div class="dateContainer menuParent">
            <div class="dates">
                <p class="date">{{promptDate}}</p>
            </div>

            <div v-click-outside="closeMenu">
                <button @click="toggleMenu()" class="secondary icon dots wiggle" v-bind:class="{ open: menuOpen }" v-show="!doReflect && responsesLoaded && (responses.length > 0 || responseText)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
                        <path d="M24 27.059A3.53 3.53 0 1 1 24 20a3.53 3.53 0 0 1 0 7.059zm16.47 0a3.53 3.53 0 1 1 0-7.059 3.53 3.53 0 0 1 0 7.059zm-32.94 0a3.53 3.53 0 1 1 0-7.059 3.53 3.53 0 0 1 0 7.059z"/>
                    </svg>
                </button>
                <transition name="fade-down">
                    <nav class="moreMenu" v-show="menuOpen">
                        <a :href="prompt? prompt.contentPath : '#'" target="_blank" v-show="prompt && prompt.contentPath">Go&nbsp;Deeper</a>
                        <!-- <a href="#" v-on:click.prevent="deleteSentPrompt" v-show="prompt">Ignore&nbsp;Question</a> -->
                        <a href="#" v-on:click.prevent="startEditing" v-show="responses.length > 0">Edit Reflection</a>
                    </nav>
                </transition>
            </div>
        </div>

        <h3 class="question">{{questionText}}</h3>
        <p v-show="!prompt && promptLoaded" class="warning prompt">
            Oops! We were unable to load the question for this day.
        </p>

        <div class="entry" v-if="!doReflect">{{responseText}}</div>

        <form v-show="doReflect" v-on:submit.prevent>
            <div v-for="editedResponse in editedResponses">
                <textarea v-model="editedResponse.text"></textarea>
            </div>
            <nav class="buttonContainer">
                <button class="primary small" v-on:click="doneEditing" type="button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
                        <path d="M6.008 24.462a1.176 1.176 0 0 0-1.663 1.664l11.764 11.765c.46.46 1.205.46 1.664 0l25.882-25.883a1.176 1.176 0 1 0-1.663-1.663l-25.05 25.05L6.007 24.462z"/>
                    </svg>
                    Done
                </button>
                <button class="secondary small" v-on:click="cancelEditing" type="button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                        <path d="M13.851 12l7.762 7.761a1.3 1.3 0 0 1 0 1.852c-.249.248-.58.387-.926.387-.347 0-.678-.14-.926-.387L12 13.85l-7.761 7.762c-.248.248-.58.387-.926.387-.346 0-.677-.14-.926-.387a1.3 1.3 0 0 1 0-1.852L10.15 12 2.387 4.239a1.3 1.3 0 0 1 0-1.852 1.3 1.3 0 0 1 1.852 0L12 10.15l7.761-7.762a1.3 1.3 0 0 1 1.852 0 1.3 1.3 0 0 1 0 1.852L13.85 12z"/>
                    </svg>
                    Cancel
                </button>
            </nav>
        </form>
        <nav v-show="!doReflect && responsesLoaded && (responses.length === 0 || !responseText)" class="buttonContainer">
            <button v-on:click="startEditing" class="primary small wiggle">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
                    <path d="M34.123 5.695a5.786 5.786 0 1 1 8.182 8.182l-27.59 27.591a1.104 1.104 0 0 1-.514.29l-8.829 2.208a1.104 1.104 0 0 1-1.338-1.338l2.207-8.83c.049-.194.15-.37.29-.512L34.124 5.695zM13.37 39.692l27.374-27.375a3.579 3.579 0 0 0-5.06-5.061L8.307 34.63 6.621 41.38l6.749-1.687z"/>
                </svg>
                Reflect
            </button>
            <a v-if="prompt && prompt.contentPath && !prompt.hasPromptContent" :href="prompt.contentPath" class="secondary small button wiggle">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
                    <path d="M35.579 26.105a1.053 1.053 0 1 1 2.105 0v12.632A5.263 5.263 0 0 1 32.421 44H9.263A5.263 5.263 0 0 1 4 38.737V15.579a5.263 5.263 0 0 1 5.263-5.263h12.632a1.053 1.053 0 1 1 0 2.105H9.263a3.158 3.158 0 0 0-3.158 3.158v23.158a3.158 3.158 0 0 0 3.158 3.158h23.158a3.158 3.158 0 0 0 3.158-3.158V26.105zm4.827-20h-10.09a1.053 1.053 0 1 1 0-2.105h12.631C43.53 4 44 4.471 44 5.053v12.631a1.053 1.053 0 1 1-2.105 0V7.594l-21.361 21.36a1.053 1.053 0 1 1-1.489-1.488l21.361-21.36z"/>
                </svg>
                Go Deeper
            </a>
            <div v-if="prompt && prompt.promptContentEntryId">
                <a :href="promptContentPath" @click.prevent="showContent = true" class="secondary small button wiggle">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
                        <path d="M35.579 26.105a1.053 1.053 0 1 1 2.105 0v12.632A5.263 5.263 0 0 1 32.421 44H9.263A5.263 5.263 0 0 1 4 38.737V15.579a5.263 5.263 0 0 1 5.263-5.263h12.632a1.053 1.053 0 1 1 0 2.105H9.263a3.158 3.158 0 0 0-3.158 3.158v23.158a3.158 3.158 0 0 0 3.158 3.158h23.158a3.158 3.158 0 0 0 3.158-3.158V26.105zm4.827-20h-10.09a1.053 1.053 0 1 1 0-2.105h12.631C43.53 4 44 4.471 44 5.053v12.631a1.053 1.053 0 1 1-2.105 0V7.594l-21.361 21.36a1.053 1.053 0 1 1-1.489-1.488l21.361-21.36z"/>
                    </svg>
                    Go Deeper
                </a>
                <modal v-bind:show="showContent" v-on:close="showContent = false" :showCloseButton="false">
                    <PromptContent slot="body" v-bind:promptContentEntryId="prompt.promptContentEntryId" v-on:close="showContent = false"/>
                </modal>
            </div>

        </nav>

    </article>
</template>

<script lang="ts">
    import Vue from 'vue'
    import * as DateUtil from "@shared/util/DateUtil";
    import ReflectionResponse, {ResponseMedium} from '@shared/models/ReflectionResponse'
    import ReflectionResponseService from '@web/services/ReflectionResponseService'
    import SentPrompt from "@shared/models/SentPrompt"
    import {ListenerUnsubscriber} from "@web/services/FirestoreService"
    import ReflectionPromptService from "@web/services/ReflectionPromptService"
    import ReflectionPrompt from "@shared/models/ReflectionPrompt"
    import SentPromptService from "@web/services/SentPromptService"
    import {clickOutsideDirective} from '@web/vueDirectives'
    import Modal from "@components/Modal.vue";
    import PromptContent from "@components/PromptContent.vue"
    import {PageRoute} from '@web/PageRoutes'
    import {getResponseText} from '@shared/util/StringUtil'

    declare interface ReflectionResponseCardData {
        doReflect: boolean,
        editedText: string,
        menuOpen: boolean,
        deleting: boolean,
        prompt?: ReflectionPrompt,
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
        },
        directives: {
            'click-outside': clickOutsideDirective(),
        },
        props: {
            sentPrompt: SentPrompt
        },
        created() {
            const sentPrompt = this.sentPrompt;
            const promptId = sentPrompt.promptId;
            if (promptId) {
                this.promptUnsubscriber = ReflectionPromptService.sharedInstance.observeById(promptId, {
                    includeDeleted: false, onData: prompt => {
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
            promptContentPath(): string | undefined {
                if (this.prompt && this.prompt.promptContentEntryId) {
                    return `${PageRoute.PROMPTS_ROOT}/${this.prompt.promptContentEntryId}`
                }
                return;
            },
            promptDate(): string | undefined {
                return DateUtil.formatDate(this.sentPrompt.firstSentAt, "LLL d, yyyy")
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
            async doneEditing() {
                this.doReflect = false;


                const responsesById: { [id: string]: ReflectionResponse } = this.responses.reduce((map: { [id: string]: ReflectionResponse }, response) => {
                    if (response.id) {
                        map[response.id as string] = response;
                    }
                    return map;
                }, {});

                const tasks: Promise<any>[] = [];
                this.editedResponses.forEach(edit => {
                    return new Promise(async resolve => {
                        let response = edit.id ? responsesById[edit.id] : undefined;
                        if (!response && this.prompt && this.prompt.id) {
                            response = await ReflectionResponseService.sharedInstance.createReflectionResponse(this.prompt.id, ResponseMedium.JOURNAL_WEB, this.prompt.question)
                        }

                        if (edit.text && edit.text.trim() && response) {
                            response.content.text = edit.text;
                            //saving will trigger a refresh of the data elsewhere, so we shouldn't need to update anything here;
                            await ReflectionResponseService.sharedInstance.save(response);
                        } else if (response && response.id) {
                            //the text was deleted, delete the response;
                            await ReflectionResponseService.sharedInstance.delete(response);
                        } else {
                            console.error("There was no response available to save... this shouldn't happen");
                        }
                        resolve();
                    })
                });
                await Promise.all(tasks);

            },
            toggleMenu() {
                this.menuOpen = !this.menuOpen;
            },
            closeMenu() {
                this.menuOpen = false;
            },
            cancelEditing() {
                const responsesById: { [id: string]: ReflectionResponse } = this.responses.reduce((map: { [id: string]: ReflectionResponse }, response) => {
                    if (response.id) {
                        map[response.id as string] = response;
                    }
                    return map;
                }, {});

                const foundChange = this.editedResponses.find(edit => {
                    if (!edit.id && edit.text.trim()) {
                        return true;
                    } else if (edit.id && responsesById[edit.id]) {
                        const response = responsesById[edit.id];
                        const existingText = response.content.text || "";
                        return existingText.trim() !== edit.text.trim();
                    }
                    return false;
                });

                if (foundChange) {
                    const c = confirm("You have unsaved changes. Are you sure you want to cancel?");
                    if (c) {
                        console.log("confirmed cancel");
                        // this.editedText = this.responseText;
                        this.doReflect = false;
                    } else {
                        console.log("don't cancel");
                    }
                } else {
                    console.log("no changes, just closing");
                    this.doReflect = false;
                }
            },
            async deleteSentPrompt() {

                const c = confirm("Are you sure you want to ignore this question? It will no longer be available in your journal");
                if (!c) {
                    return;
                }

                if (this.prompt && this.prompt.id) {
                    await SentPromptService.sharedInstance.deleteForPromptId(this.prompt.id)
                }
            },
            startEditing() {
                this.editedText = this.responseText || "";
                this.editedResponses = this.responses.map(response => {
                    return {id: response.id || "", text: response.content.text || ""}
                });

                if (this.editedResponses.length === 0) {
                    this.editedResponses = [{id: undefined, text: ""}];
                }


                this.doReflect = true;
                this.menuOpen = false;
            },
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

    .journalEntry {
        background-color: white;
        border: 1px solid $lightest;
        border-radius: 12px;
        margin: 0 .8rem 2.4rem;
        padding: 2.4rem 1.6rem;

        .entry {
            white-space: pre-line;
        }

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


    .moreMenu {
        background-color: $lightPink;
        border-radius: 6px;
        right: 0;
        padding: .8rem 0;
        position: absolute;
        top: 4rem;

        a {
            background-color: transparent;
            color: $darkestPink;
            display: block;
            font-size: 1.6rem;
            opacity: .8;
            padding: .8rem 2.4rem;
            text-decoration: none;
            transition: opacity .2s ease-in-out, background-color .2s ease-in-out;

            &:hover {
                background-color: lighten($lightPink, 2%);
                opacity: 1;
            }
        }
    }

    .question {
        margin-bottom: .8rem;
        white-space: pre-line;
    }

    textarea {
        border: 1px solid $green;
        border-radius: 6px;
        font-size: 1.6rem;
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
