<template>

    <article class="journalEntry new" id="reflectParent">
        <div class="dateContainer menuParent">
            <div class="dates">
                <p class="date">{{promptDate}}</p>
            </div>

            <div v-click-outside="closeMenu">
                <button @click="toggleMenu()" class="secondary icon dots" v-bind:class="{ open: menuOpen }">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
                        <path d="M24,27.0588235 C22.0507597,27.0588235 20.4705882,25.4786521 20.4705882,23.5294118 C20.4705882,21.5801715 22.0507597,20 24,20 C25.9492403,20 27.5294118,21.5801715 27.5294118,23.5294118 C27.5294118,25.4786521 25.9492403,27.0588235 24,27.0588235 Z M40.4705882,27.0588235 C38.5213479,27.0588235 36.9411765,25.4786521 36.9411765,23.5294118 C36.9411765,21.5801715 38.5213479,20 40.4705882,20 C42.4198285,20 44,21.5801715 44,23.5294118 C44,25.4786521 42.4198285,27.0588235 40.4705882,27.0588235 Z M7.52941176,27.0588235 C5.58017147,27.0588235 4,25.4786521 4,23.5294118 C4,21.5801715 5.58017147,20 7.52941176,20 C9.47865206,20 11.0588235,21.5801715 11.0588235,23.5294118 C11.0588235,25.4786521 9.47865206,27.0588235 7.52941176,27.0588235 Z"/>
                    </svg>
                </button>
                <transition name="fade-down">
                    <nav class="moreMenu" v-show="menuOpen">
                        <a :href="prompt? prompt.contentPath : '#'" target="_blank" v-show="prompt && prompt.contentPath">Go&nbsp;Deeper</a>
                        <a href="#" v-on:click.prevent="deleteSentPrompt" v-show="prompt">Ignore&nbsp;Question</a>
                        <a href="#" v-on:click.prevent="startEditing" v-show="responses.length > 0">Edit Response</a>
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
            <button class="primary small" v-on:click="doneEditing" type="button">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
                    <path d="M6.00836092,24.4622273 C5.54892058,24.002787 4.8040206,24.002787 4.34458026,24.4622273 C3.88513991,24.9216677 3.88513991,25.6665676 4.34458026,26.126008 L16.1092861,37.8907139 C16.5687265,38.3501542 17.3136265,38.3501542 17.7730668,37.8907139 L43.6554197,12.0083609 C44.1148601,11.5489206 44.1148601,10.8040206 43.6554197,10.3445803 C43.1959794,9.88513991 42.4510794,9.88513991 41.9916391,10.3445803 L16.9411765,35.3950429 L6.00836092,24.4622273 Z"/>
                </svg>
                Done
            </button>
            <button class="secondary small" v-on:click="cancelEditing" type="button">
                Cancel
            </button>
        </form>
        <nav v-show="!doReflect && responsesLoaded && (responses.length === 0 || !responseText)" class="buttonContainer">
            <button v-on:click="startEditing" class="secondary small">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
                    <path d="M34.1225601,5.69480994 C35.5842461,4.23312388 37.7147,3.66227049 39.7114003,4.19728472 C41.7081006,4.73229895 43.267701,6.29189942 43.8027153,8.28859971 C44.3377295,10.2853 43.7668761,12.4157539 42.3051901,13.8774399 L14.7141653,41.4684646 C14.572724,41.609906 14.3955015,41.7102477 14.2014456,41.7587616 L5.37231767,43.9660436 C4.56403257,44.1681149 3.83188511,43.4359674 4.03395638,42.6276823 L6.24123836,33.7985544 C6.28975234,33.6044985 6.39009403,33.427276 6.53153536,33.2858347 L34.1225601,5.69480994 Z M13.3695374,39.6915245 L40.744406,12.3166559 C41.6484776,11.4125842 42.0015578,10.0948711 41.6706446,8.85988633 C41.3397314,7.62490151 40.3750985,6.66026857 39.1401137,6.32935539 C37.9051289,5.9984422 36.5874158,6.35152237 35.6833441,7.255594 L8.30847549,34.6304626 L6.62145487,41.3785451 L13.3695374,39.6915245 Z"/>
                </svg>
                Reflect
            </button>
            <a v-if="prompt && prompt.contentPath" :href="prompt.contentPath" class="secondary small button">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
                    <path d="M35.5789474,26.1052632 C35.5789474,25.5239108 36.0502266,25.0526316 36.6315789,25.0526316 C37.2129313,25.0526316 37.6842105,25.5239108 37.6842105,26.1052632 L37.6842105,38.7368421 C37.6842105,41.6436039 35.3278145,44 32.4210526,44 L9.26315789,44 C6.35639605,44 4,41.6436039 4,38.7368421 L4,15.5789474 C4,12.6721855 6.35639605,10.3157895 9.26315789,10.3157895 L21.8947368,10.3157895 C22.4760892,10.3157895 22.9473684,10.7870687 22.9473684,11.3684211 C22.9473684,11.9497734 22.4760892,12.4210526 21.8947368,12.4210526 L9.26315789,12.4210526 C7.51910079,12.4210526 6.10526316,13.8348903 6.10526316,15.5789474 L6.10526316,38.7368421 C6.10526316,40.4808992 7.51910079,41.8947368 9.26315789,41.8947368 L32.4210526,41.8947368 C34.1651097,41.8947368 35.5789474,40.4808992 35.5789474,38.7368421 L35.5789474,26.1052632 Z M40.406091,6.10526316 L30.3157895,6.10526316 C29.7344371,6.10526316 29.2631579,5.63398395 29.2631579,5.05263158 C29.2631579,4.47127921 29.7344371,4 30.3157895,4 L42.9473684,4 C43.5287208,4 44,4.47127921 44,5.05263158 L44,17.6842105 C44,18.2655629 43.5287208,18.7368421 42.9473684,18.7368421 C42.3660161,18.7368421 41.8947368,18.2655629 41.8947368,17.6842105 L41.8947368,7.59390901 L20.5337966,28.9548492 C20.1227184,29.3659274 19.456229,29.3659274 19.0451508,28.9548492 C18.6340726,28.543771 18.6340726,27.8772816 19.0451508,27.4662034 L40.406091,6.10526316 Z"/>
                </svg>
                Go Deeper
            </a>
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
    }

    export default Vue.extend({
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
                editedResponses: []
            }
        },
        watch: {},
        computed: {
            promptDate(): string | undefined {
                return DateUtil.formatDate(this.sentPrompt.firstSentAt, "LLL d, yyyy")
            },
            responseText(): string | undefined {
                if (this.responses.length === 0) {
                    return;
                }
                return this.responses.map(r => (r.content.text || "").trim()).join("\n\n").trim();
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
                        if (response) {
                            response.content.text = edit.text;
                            //saving will trigger a refresh of the data elsewhere, so we shouldn't need to update anything here;
                            await ReflectionResponseService.sharedInstance.save(response);
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
                if (this.responseText && this.editedText.trim() !== this.responseText) {
                    const c = confirm("You have unsaved changes. Are you sure you want to cancel?");
                    if (c) {
                        console.log("confirmed cancel");
                        this.editedText = this.responseText;
                        this.doReflect = false;
                    } else {
                        console.log("don't cancel");
                    }
                } else {
                    console.log("no changes, just closing");
                    this.doReflect = false;
                }
            },
            async deleteReflection() {
                const c = confirm("Are you sure you want to delete this reflection?");
                if (c) {
                    this.closeMenu();
                    const tasks: Promise<any>[] = [];
                    this.responses.forEach(response => {
                        tasks.push(ReflectionResponseService.sharedInstance.delete(response));
                    });
                    await Promise.all(tasks);
                }
            },
            async deleteSentPrompt() {

                const c = confirm("Are you sure you want to delete this question? It will no longer be available in your journal");
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
            }
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

        svg {
            fill: $darkGreen;
            height: 1.6rem;
            margin-right: .8rem;
            width: 1.6rem;
        }

        &.icon svg {
            margin-right: 0;
        }

        &.primary svg {
            fill: white;
        }
    }

    .journalEntry {
        background-color: white;
        border: 1px solid $lightest;
        margin: 0 auto 2.4rem;
        padding: 3.2rem 1.6rem;

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
        /*flex-direction: column;*/
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
        min-height: 11rem;
        padding: 1.6rem;
        width: 100%;
    }

    .buttonContainer {
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
        outline: transparent none;

        transition: all .2s ease;

        &.open {
            transform: rotate(90deg);
            transform-origin: center;
        }

        &:hover {
            svg {
                animation: wiggle .5s forwards;
                fill: $darkestGreen;
            }
        }
    }

</style>