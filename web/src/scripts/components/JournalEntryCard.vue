<template>

    <article class="journalEntry" id="reflectParent" v-bind:class="{ new: !responseText }">

        <div class="dateContainer menuParent">
            <div class="dates">
                <!-- <div class="doneStatus" v-show="responsesLoaded && (responses.length !== 0 || responseText)">Done</div> -->
                <p class="date">{{promptDate}}</p>
            </div>

            <div v-click-outside="closeMenu">
                <button @click="toggleMenu()" class="secondary icon dots wiggle" v-bind:class="{ open: menuOpen }">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
                        <path d="M24 27.059A3.53 3.53 0 1 1 24 20a3.53 3.53 0 0 1 0 7.059zm16.47 0a3.53 3.53 0 1 1 0-7.059 3.53 3.53 0 0 1 0 7.059zm-32.94 0a3.53 3.53 0 1 1 0-7.059 3.53 3.53 0 0 1 0 7.059z"/>
                    </svg>
                </button>
                <transition name="fade-down">
                    <nav class="moreMenu" v-show="menuOpen">
                        <!-- <a href="#" v-on:click.prevent="deleteSentPrompt" v-show="prompt">Ignore&nbsp;Question</a> -->
                        <a href="#">Share Prompt</a>
                        <a href="#" v-on:click.prevent="startEditing" v-show="responses.length > 0">Edit Reflection</a>
                    </nav>
                </transition>
            </div>
        </div>

        <h3 class="topic" v-show="prompt && prompt.promptContentEntryId">Who lightens the burden</h3>
        <p class="subtext" v-show="prompt && prompt.promptContentEntryId">Today you’ll reflect on someone who helps you when you are worried about something.</p>

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
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 13"><path fill="#fff" d="M1.707 6.293A1 1 0 0 0 .293 7.707l5 5a1 1 0 0 0 1.414 0l11-11A1 1 0 1 0 16.293.293L6 10.586 1.707 6.293z"/></svg>
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
        <nav v-show="!doReflect && responsesLoaded" class="buttonContainer">
            <a v-if="prompt && prompt.contentPath" :href="prompt.contentPath" class="button" v-bind:class="{ secondary: responseText }">
                Reflect
            </a>
            <div class="promptBtn" v-if="prompt && prompt.promptContentEntryId">
                <a :href="promptContentPath" @click.prevent="showContent = true" class="button" v-bind:class="{ secondary: responseText }">Reflect</a>
            </div>

        </nav>
        <img class="backgroundImage" src="/assets/images/nature.svg" alt="" />
        <modal v-if="prompt && prompt.promptContentEntryId" v-bind:show="showContent" v-on:close="showContent = false" :showCloseButton="true">
            <PromptContent slot="body" v-bind:promptContentEntryId="prompt.promptContentEntryId" v-on:close="showContent = false"/>
        </modal>
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
                            response = await ReflectionResponseService.createReflectionResponse(this.prompt.id, ResponseMedium.JOURNAL_WEB, this.prompt.question)
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

    .topic,
    .question,
    .subtext {
        @include r(600) {
            max-width: 66%;
        }
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

        @include r(600) {
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

        &:nth-child(3n), &:nth-child(2n) {
            .backgroundImage {
                display: none;
            }
        }

        // &:nth-child(1), &:nth-child(16) {
        //     background: url(assets/images/maroonTriangleBlob.svg) right -130px bottom -52px/310px no-repeat;
        // }
        // &:nth-child(3) {
        //     background: no-repeat;
        //     background-image: url(assets/images/greenNeedleBlob.svg), url(assets/images/pinkBlob.svg);
        //     background-position: right -130px bottom -52px;
        //     background-size: 290px, 230px;
        // }
        // &:nth-child(4) {
        //     background: url(assets/images/yellowNeedleBlob.svg) left 450px top 188px/540px no-repeat;
        // }
        // &:nth-child(7) {
        //     background: no-repeat;
        //     background-image: url(assets/images/greenVs.svg), url(assets/images/lightGreenBlob.svg);
        //     background-position: right -130px bottom -52px;
        //     background-size: 310px, 230px;
        // }
        //
        // &:nth-child(9) {
        //     background: url(assets/images/greenVs.svg) right -130px bottom -70px/260px no-repeat;
        // }
        // &:nth-child(10) {
        //     background: no-repeat;
        //     background-image: url(assets/images/maroonTriangleBlob.svg), url(assets/images/greenBlob.svg);
        //     background-position: right -130px bottom -52px, right -130px bottom -112px;
        //     background-size: 310px, 230px;
        // }
        // &:nth-child(13) {
        //     background: url(assets/images/yellowNeedleBlob.svg) left 450px top 138px/540px no-repeat;
        // }
        // &:nth-child(15) {
        //     background: no-repeat;
        //     background-image: url(assets/images/yellowNeedleBlob.svg), url(assets/images/yellowBlob.svg);
        //     background-position: right -450px bottom -290px, right -220px bottom -90px;
        //     background-size: 570px, 280px;
        // }
    }

    .backgroundImage {
        bottom: -4rem;
        left: -2.4rem;
        margin: 0 auto;
        position: relative;
        right: 0;
        width: 120%;

        @include r(600) {
            bottom: -2.4rem;
            height: auto;
            left: 60%;
            position: absolute;
            width: 60%;
        }
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
