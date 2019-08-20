<template>
    <div :class="['page-wrapper', slideNumberClass] ">
        <transition appear name="fade-in" mode="out-in">
            <div class="centered" v-if="loading">
                <spinner message="Loading..." :delay="1000"/>
            </div>

            <div v-if="!loading && !promptContent">
                No prompt found for id
            </div>

            <section class="content-container centered" v-if="!loading && promptContent">
                <div class="shareContainer">
                    <button class="share tertiary wiggle" @click="showSharing = true" v-show="!showSharing">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 22">
                            <path fill="#29A389" d="M10 3.414V14a1 1 0 0 1-2 0V3.414L5.707 5.707a1 1 0 0 1-1.414-1.414l4-4a1 1 0 0 1 1.414 0l4 4a1 1 0 1 1-1.414 1.414L10 3.414zM0 11a1 1 0 0 1 2 0v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8a1 1 0 0 1 2 0v8a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3v-8z"/>
                        </svg>
                        <span class="buttonText">Share Today's Prompt</span>
                    </button>
                    <button class="share tertiary wiggle back" @click="showSharing = false" v-show="showSharing">
                        <div class="arrow-wrapper">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18">
                                <path fill="#29A389" d="M12.586 7L7.293 1.707A1 1 0 0 1 8.707.293l7 7a1 1 0 0 1 0 1.414l-7 7a1 1 0 1 1-1.414-1.414L12.586 9H1a1 1 0 1 1 0-2h11.586z"/>
                            </svg>
                        </div>
                        <span class="buttonText">Back</span>
                    </button>
                </div>
                <div class="progress-wrapper" v-if="!completed && !showSharing">
                    <div class="progress">
                        <span v-for="(content, index) in promptContent.content" :class="['segment', {complete: index <= activeIndex}]"></span>
                    </div>
                </div>

                <div :class="['flipper', {flipped: showSharing}]">
                    <div class="front flip-card">
                        <transition :name="transitionName" mode="out-in" v-if="!completed">
                            <content-card
                                    v-bind:key="activeIndex"
                                    v-bind:content="promptContent.content[activeIndex]"
                                    v-bind:response="reflectionResponse"
                                    v-bind:hasNext="hasNext && activeIndex > 0"
                                    v-bind:reflectionDuration="reflectionDuration"
                                    v-bind:saving="saving"
                                    v-bind:saved="saved"
                                    v-touch:swipe.left="next"
                                    v-touch:swipe.right="previous"
                                    v-on:next="next"
                                    v-on:previous="previous"
                                    v-on:complete="complete"
                                    v-on:save="save"/>
                        </transition>
                        <transition name="celebrate" appear mode="out-in" v-if="completed">
                            <celebrate v-on:back="completed = false"
                                    v-on:restart="restart" v-on:close="close"
                                    v-bind:reflectionResponse="reflectionResponse"
                            />
                        </transition>
                    </div>
                    <div class="back flip-card">
                        <prompt-content-sharing v-bind:promptContent="promptContent"/>
                    </div>
                </div>

                <button class="previous arrow secondary" @click="previous" v-show="hasPrevious && !showSharing">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                        <path d="M12.586 7L7.293 1.707A1 1 0 0 1 8.707.293l7 7a1 1 0 0 1 0 1.414l-7 7a1 1 0 1 1-1.414-1.414L12.586 9H1a1 1 0 1 1 0-2h11.586z"/>
                    </svg>
                </button>
                <button :class="['next', 'arrow', 'secondary', {reflection: isReflection, complete: reflectionComplete}]"
                        @click="next"
                        v-show="hasNext && activeIndex > 0 && !showSharing"
                >
                    <div class="progress-circle" v-if="isReflection">
                        <pie-spinner :percent="reflectionProgress"/>
                    </div>

                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                        <path d="M12.586 7L7.293 1.707A1 1 0 0 1 8.707.293l7 7a1 1 0 0 1 0 1.414l-7 7a1 1 0 1 1-1.414-1.414L12.586 9H1a1 1 0 1 1 0-2h11.586z"/>
                    </svg>
                </button>
            </section>
        </transition>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {PageRoute} from '@web/PageRoutes'
    import ContentCard from "@components/PromptContentCard.vue"
    import Celebrate from "@components/ReflectionCelebrateCard.vue";
    import PromptContent, {ContentType,} from '@shared/models/PromptContent'
    import Spinner from "@components/Spinner.vue";
    import Vue2TouchEvents from 'vue2-touch-events'
    import {getFlamelink} from '@web/firebase'
    import {ListenerUnsubscriber} from '@web/services/FirestoreService'
    import {getQueryParam, updateQueryParam} from '@web/util'
    import {QueryParam} from "@shared/util/queryParams"
    import PromptContentSharing from "@components/PromptContentSharing.vue";
    import ReflectionResponseService from '@web/services/ReflectionResponseService'
    import ReflectionResponse, {ResponseMedium} from '@shared/models/ReflectionResponse'
    import PieSpinner from "@components/PieSpinner.vue"
    import {MINIMUM_REFLECT_DURATION_MS} from '@web/PromptContentUtil'
    import CactusMemberService from '@web/services/CactusMemberService'
    import CactusMember from '@shared/models/CactusMember'
    import StorageService, {LocalStorageKey} from '@web/services/StorageService'

    const flamelink = getFlamelink();
    Vue.use(Vue2TouchEvents);

    const MIN_REFLECTION_MS = MINIMUM_REFLECT_DURATION_MS;
    const REFLECT_UPDATE_INTERVAL_MS = 100;

    export default Vue.extend({
        components: {
            ContentCard,
            Spinner,
            Celebrate,
            PromptContentSharing,
            PieSpinner,
        },
        props: {
            promptContentEntryId: String,
            onClose: {
                type: Function, default: function () {
                    this.$emit("close")
                }
            }
        },
        async created(): Promise<void> {

            this.memberUnsubscriber = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: ({member}) => {
                    this.authLoaded = true;
                    this.member = member;
                }
            });


            let promptContentId = this.promptContentEntryId;
            if (!this.promptContentEntryId) {
                promptContentId = window.location.pathname.split(`${PageRoute.PROMPTS_ROOT}/`)[1];
                console.log("using path for promptContentId", promptContentId);
            } else {
                console.log("using prop for promptContentId", promptContentId)
            }

            let slideParam = getQueryParam(QueryParam.CONTENT_INDEX);
            let slideNumber = 0;
            let isDone = false;
            if (slideParam === "done") {
                isDone = true;
            } else {
                slideNumber = Number(getQueryParam(QueryParam.CONTENT_INDEX) || 0);
            }


            // flamelink.content.subscribe()

            //TODO: use a promptContentService
            this.promptsUnsubscriber = await flamelink.content.subscribe({
                entryId: promptContentId,
                schemaKey: "promptContent",
                populate: [{
                    field: 'content',
                    subFields: [{field: 'backgroundImage', subFields: "imageIds"}]
                }],
                callback: (error: any, data: Partial<PromptContent>) => {
                    if (error || !data) {
                        this.promptContent = undefined;
                        this.loading = false;
                        return console.error("Failed to load prompts", error)
                    }
                    console.log("raw promptContent data", data);

                    const promptContent = new PromptContent(data);

                    this.activeIndex = (slideNumber > promptContent.content.length - 1) ? 0 : slideNumber;
                    if (isDone) {
                        this.completed = true;
                    }
                    updateQueryParam(QueryParam.CONTENT_INDEX, this.activeIndex);
                    this.promptContent = promptContent;
                    this.loading = false;

                    const [firstContent] = promptContent.content;
                    if (firstContent && firstContent.text) {
                        document.title = `${firstContent.text} | Cactus`;
                    } else {
                        document.title = 'Daily Prompt | Cactus'
                    }

                }
            });
        },
        destroyed() {
            if (this.promptsUnsubscriber) {
                console.log("Unsubscribing from flamelink promptContent listener");
                this.promptsUnsubscriber();
            }

            if (this.reflectionResponseUnsubscriber) {
                this.reflectionResponseUnsubscriber();
            }
        },
        data(): {
            promptContent: PromptContent | undefined,
            loading: boolean,
            activeIndex: number,
            transitionName: string,
            completed: boolean,
            promptsUnsubscriber: ListenerUnsubscriber | undefined,
            showSharing: boolean,
            reflectionResponseUnsubscriber: ListenerUnsubscriber | undefined,
            reflectionResponses: ReflectionResponse[],
            reflectionResponse: ReflectionResponse | undefined,
            saving: boolean,
            saved: boolean,
            reflectionDuration: number,
            reflectionTimerInterval: any,
            authLoaded: boolean,
            memberUnsubscriber: ListenerUnsubscriber | undefined,
            member: CactusMember | undefined,
        } {
            return {
                promptContent: undefined,
                loading: true,
                activeIndex: 0,
                transitionName: "slide",
                promptsUnsubscriber: undefined,
                completed: false,
                showSharing: false,
                reflectionResponseUnsubscriber: undefined,
                reflectionResponses: [],
                reflectionResponse: undefined,
                saving: false,
                saved: false,
                reflectionDuration: 0,
                reflectionTimerInterval: undefined,
                authLoaded: false,
                memberUnsubscriber: undefined,
                member: undefined,
            };
        },
        computed: {
            slideNumberClass(): string {
                return `slide-${this.activeIndex}`
            },
            hasNext(): boolean {
                return this.promptContent && this.promptContent.content && this.activeIndex < this.promptContent.content.length - 1 || false
            },
            hasPrevious(): boolean {
                return this.activeIndex > 0;
            },
            reflectionProgress(): number {
                return Math.min(this.reflectionDuration / MIN_REFLECTION_MS, 1)
            },
            reflectionComplete(): boolean {
                return this.reflectionDuration >= MIN_REFLECTION_MS
            },
            isReflection(): boolean {
                if (this.promptContent && this.promptContent.content.length > this.activeIndex) {
                    const activeContent = this.promptContent.content[this.activeIndex];
                    const isReflect = activeContent.contentType === ContentType.reflect || false;
                    return isReflect
                }
                return false;
            },
            reflectionProgressStyles(): any | undefined {
                if (this.isReflection) {
                    const styles = {
                        transform: `rotate(${Math.min(this.reflectionProgress, 1) * 360}deg)`,
                    };
                    console.log("Style object", styles);
                    return styles;
                }
            },
            storageKey(): string | undefined {
                if (this.promptContent && this.promptContent.promptId) {
                    return StorageService.buildKey(LocalStorageKey.anonReflectionResponse, this.promptContent.promptId || "unknown");
                }
            }
        },
        watch: {
            activeIndex(index: number) {
                updateQueryParam(QueryParam.CONTENT_INDEX, index);

                if (this.promptContent && this.promptContent.content.length > index) {
                    const activeContent = this.promptContent.content[index];
                    let isReflect = activeContent.contentType === ContentType.reflect || false;

                    if (isReflect) {
                        this.startReflectionTimer();
                    } else {
                        this.stopReflectionTimer();
                    }
                }

            },
            promptContent(newContent: PromptContent | undefined, oldContent: PromptContent | undefined) {
                if (!newContent || (!oldContent || newContent.promptId !== oldContent.promptId)) {
                    this.subscribeToResponse();
                }
            }
        },
        methods: {
            stopReflectionTimer() {
                clearInterval(this.reflectionTimerInterval);
                this.reflectionTimerInterval = undefined;
            },
            startReflectionTimer() {
                if (!this.reflectionTimerInterval) {
                    const interval = REFLECT_UPDATE_INTERVAL_MS;
                    this.reflectionTimerInterval = setInterval(() => {
                        this.reflectionDuration += interval
                    }, interval)
                }
            },
            subscribeToResponse() {
                console.log("subscribing to reflection responses ");
                if (this.reflectionResponseUnsubscriber) {
                    this.reflectionResponseUnsubscriber();
                }
                let promptId = this.promptContent && this.promptContent.promptId;
                const promptContent = this.promptContent && this.promptContent.content.find(content => content.contentType === ContentType.reflect);
                const promptQuestion = promptContent ? promptContent.text : undefined;

                if (promptId) {
                    const localResponse = StorageService.getModel(LocalStorageKey.anonReflectionResponse, ReflectionResponse, promptId);
                    console.log("local response ", localResponse);
                    const createdResponse = ReflectionResponseService.createPossiblyAnonymousReflectionResponse(promptId as string, ResponseMedium.PROMPT_WEB, promptQuestion);
                    this.reflectionResponse = localResponse || createdResponse;
                    this.reflectionDuration = this.reflectionResponse ? (this.reflectionResponse.reflectionDurationMs || 0) : 0;

                    console.log("subscribing to responses for promptId", promptId);
                    this.reflectionResponseUnsubscriber = ReflectionResponseService.sharedInstance.observeForPromptId(promptId, {
                        onData: (responses) => {
                            console.log("Fetched reflection responses from subscriber", responses);

                            const [first] = responses;
                            //TODO: combine if there are multiple?
                            const response = first || createdResponse;
                            console.log("Got response as", response.toJSON());
                            this.reflectionResponses = responses;
                            this.reflectionResponse = response;
                            this.reflectionDuration = response.reflectionDurationMs || 0;
                        }
                    })
                }
            },

            async save(): Promise<ReflectionResponse | undefined> {
                if (this.reflectionResponse) {
                    this.saving = true;
                    this.saved = false;
                    this.reflectionResponse.reflectionDurationMs = this.reflectionDuration;
                    const saved = await ReflectionResponseService.sharedInstance.save(this.reflectionResponse, {saveIfAnonymous: true});
                    this.reflectionResponse = saved;
                    if (!this.member && saved && saved.promptId) {
                        console.log("Member is not logged in, saving to localstorage");
                        StorageService.saveModel(LocalStorageKey.anonReflectionResponse, saved, saved.promptId);
                    }
                    this.saved = true;
                    this.saving = false;
                    return saved;
                } else if (!this.isReflection) {
                    console.log("Not saving. This is not a reflection screen");
                }
                return;
            },
            async next() {
                if (this.isReflection && !this.reflectionComplete) {
                    return;
                }

                this.transitionName = "slide";
                const saveTask = this.isReflection ? this.save() : () => undefined;
                const content = this.promptContent ? this.promptContent.content : [];
                if (this.hasNext) {
                    this.activeIndex = Math.min(this.activeIndex + 1, content.length - 1);
                }
                await saveTask;
            },
            async previous() {
                const saveTask = this.isReflection ? this.save() : () => undefined;
                this.transitionName = "slide-out";

                if (this.completed) {
                    this.completed = false;
                    return;
                }

                if (this.hasPrevious) {
                    this.activeIndex = Math.max(this.activeIndex - 1, 0);
                }
                await saveTask;
            },
            async complete() {
                const saveTask = this.save();
                this.transitionName = "slide";
                this.activeIndex = 0;
                this.completed = true;
                await saveTask;
            },
            async restart() {
                const saveTask = this.save();
                this.activeIndex = 0;
                this.completed = false;
                await saveTask;
            },
            close() {
                this.onClose();
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "variables";
    @import "mixins";
    @import "transitions";

    .centered {
        width: 100%;

        @include r(600) {
            width: auto;
        }
    }

    .page-wrapper {
        display: flex;
        flex-flow: column nowrap;
        flex-grow: 1;
        width: 100vw;
        justify-content: center;
        position: relative;

        button.secondary {
            transition: all .2s ease;
            outline: transparent none;

            &:hover {
                background-color: $lightGreen;
            }
        }

        .content-container {
            perspective: 1000px;
            @include r(600) {
                margin-bottom: 12rem;
            }

            .progress-wrapper {
                position: relative;
                transform: translateY(1.6rem);
                width: 94%;
                z-index: 5;
                height: 0;
                margin: 0 auto;

                .progress {
                    display: flex;

                    .segment {
                        border-radius: .8rem;
                        flex-grow: 1;
                        height: .4rem;
                        background-color: $lightGreen;

                        &:not(:last-child) {
                            margin-right: 2px;
                        }

                        &.complete {
                            background-color: $darkPink;
                        }
                    }
                }

                .reflection-progress {
                    display: flex;

                    progress {
                        flex: 1
                    }
                }
            }


            .arrow {
                display: none;

                @include r(600) {
                    align-items: center;
                    display: flex;
                    height: 4.8rem;
                    justify-content: center;
                    margin: 0 1%;
                    padding: 0;
                    position: absolute;
                    top: 38vh;
                    width: 4.8rem;
                    z-index: 10;

                    &.previous {
                        left: 0;
                    }
                    &.next {
                        right: 0;
                    }
                }

                @include r(768) {
                    left: 0;
                    margin: auto;
                    right: 0;

                    &.previous {
                        transform: translateX(-32rem);
                    }
                    &.next {
                        transform: translateX(32rem);
                    }
                }

                svg {
                    fill: $darkGreen;
                    height: 1.6rem;
                    width: 1.6rem;
                }

                &.previous svg {
                    transform: scale(-1);
                }

                &.reflection {
                    border: 0;

                    &:hover:not(.complete) {
                        background-color: $white;
                        cursor: default;
                    }

                    svg {
                        fill: $white;
                    }

                    &.complete {
                        cursor: pointer;
                        background-color: $green;

                        .progress-circle {
                            opacity: 0;
                        }
                    }

                    .progress-circle {
                        transition: opacity .3s;
                        z-index: -1;
                        opacity: .6;
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                    }
                }
            }
        }
    }

    .shareContainer {
        left: 0;
        position: absolute;
        top: 2.4rem;
        z-index: 5;

        @include r(600) {
            margin: 0 auto;
            position: static;
            width: 48rem;
        }

        svg {
            height: 2.4rem;
            width: 2rem;

            @include r(600) {
                height: 2.2rem;
                width: 1.8rem;
            }
        }

        .buttonText {
            display: none;

            @include r(600) {
                display: block;
            }
        }
    }

    button.share {
        align-items: center;
        display: flex;

        &:hover {
            background-color: transparent;
        }

        @include r(600) {
            svg {
                margin-right: .8rem;
            }
        }
    }

    .arrow-wrapper {
        transform: scale(-1);
        margin-right: .8rem;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .wiggle:hover svg {
        animation: wiggle .5s forwards;
    }


    .share-modal-body {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 2rem;
        margin-top: 2rem;
        @include shadowbox;
    }

    .slide-leave-active,
    .slide-enter-active {
        opacity: 1;
        transition: .2s ease-in-out;
    }

    .slide-enter {
        transform: translate(100%, 0);
        opacity: 0;
    }

    .slide-leave-to {
        transform: translate(-100%, 0);
        opacity: 0;
    }


    .slide-out-leave-active,
    .slide-out-enter-active {
        opacity: 1;
        transition: .2s ease-in-out;
    }

    .slide-out-enter {
        transform: translate(-100%, 0);
        opacity: 0;
    }

    .slide-out-leave-to {
        transform: translate(100%, 0);
        opacity: 0;
    }


    //FLIPPER
    .flipper {
        position: relative;
        transform-style: preserve-3d;
        transition: 0.6s;
        //height: 100%;


        display: flex;
        flex-direction: column;
        height: 100vh;
        justify-content: space-between;
        //padding: 2.4rem;
        width: 100%;


        &.flipped {
            transform: rotateY(180deg);
        }
    }

    .flip-card {
        border-radius: 12px;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        backface-visibility: hidden;
        @include r(600) {
            max-height: 66rem;
            max-width: 48rem;
        }

        &.front {
            z-index: 2;
            transform: rotateY(0);
        }

        &.back {
            background: url(assets/images/yellowNeedles.svg) $yellow;
            background-size: 80%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            transform: rotateY(180deg);
            padding: 3.2rem;
            @include r(600) {
                border-radius: 12px;
                box-shadow: rgba(7, 69, 76, 0.18) 0 11px 28px -8px;
            }
        }
    }

</style>
