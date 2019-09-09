<template xmlns:v-touch="http://www.w3.org/1999/xhtml">
    <div class="page-wrapper" :class="[slideNumberClass, {isModal}]">
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
                    <button v-if="showCloseButton" @click="close" title="Close" class="close tertiary icon" >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14">
                            <path fill="#29A389" d="M8.414 7l5.293 5.293a1 1 0 0 1-1.414 1.414L7 8.414l-5.293 5.293a1 1 0 1 1-1.414-1.414L5.586 7 .293 1.707A1 1 0 1 1 1.707.293L7 5.586 12.293.293a1 1 0 0 1 1.414 1.414L8.414 7z"/>
                        </svg>
                    </button>
                    <button class="share tertiary back" @click="showSharing = false" v-show="showSharing">
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
                    <div class="front flip-card" v-touch:tap="handleTap">
                        <transition :name="transitionName" mode="out-in" v-if="!completed">
                            <content-card
                                    v-bind:key="activeIndex"
                                    v-bind:content="promptContent.content[activeIndex]"
                                    v-bind:response="reflectionResponse"
                                    v-bind:hasNext="hasNext && activeIndex > 0"
                                    v-bind:reflectionDuration="reflectionDuration"
                                    v-bind:saving="saving"
                                    v-bind:saved="saved"
                                    v-bind:tapAnywhereEnabled="tapAnywhereEnabled"
                                    v-on:next="next"
                                    v-on:previous="previous"
                                    v-on:complete="complete"
                                    v-on:save="save"
                                    @navigationDisabled="navigationDisabled = true"
                                    @navigationEnabled="navigationDisabled = false"
                                    :style="cardStyles"
                            />
                        </transition>
                        <transition name="celebrate" appear mode="out-in" v-if="completed">
                            <celebrate v-on:back="completed = false"
                                    v-on:restart="restart" v-on:close="close"
                                    v-bind:reflectionResponse="reflectionResponse"
                                    v-bind:isModal="isModal"
                            />
                        </transition>
                    </div>
                    <div class="back flip-card">
                        <prompt-content-sharing v-bind:promptContent="promptContent"/>
                    </div>
                </div>

                <button class="previous arrow tertiary" @click="previous" v-show="hasPrevious && !showSharing">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                        <path d="M12.586 7L7.293 1.707A1 1 0 0 1 8.707.293l7 7a1 1 0 0 1 0 1.414l-7 7a1 1 0 1 1-1.414-1.414L12.586 9H1a1 1 0 1 1 0-2h11.586z"/>
                    </svg>
                </button>
                <button :class="['next', 'arrow', 'tertiary', {reflection: isReflection, complete: reflectionComplete}]"
                        @click="next"
                        v-show="(hasNext || isLastCard) && !completed && !showSharing"
                >

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
    import PromptContent, {Content, ContentType,} from '@shared/models/PromptContent'
    import Spinner from "@components/Spinner.vue";
    import Vue2TouchEvents from 'vue2-touch-events'
    import {getFlamelink} from '@web/firebase'
    import {ListenerUnsubscriber} from '@web/services/FirestoreService'
    import {getQueryParam, pushQueryParam, removeQueryParam, updateQueryParam} from '@web/util'
    import {QueryParam} from "@shared/util/queryParams"
    import PromptContentSharing from "@components/PromptContentSharing.vue";
    import ReflectionResponseService from '@web/services/ReflectionResponseService'
    import ReflectionResponse, {ResponseMedium} from '@shared/models/ReflectionResponse'
    import {MINIMUM_REFLECT_DURATION_MS} from '@web/PromptContentUtil'
    import CactusMemberService from '@web/services/CactusMemberService'
    import CactusMember from '@shared/models/CactusMember'
    import StorageService, {LocalStorageKey} from '@web/services/StorageService'
    import {getDeviceDimensions, MOBILE_BREAKPOINT_PX} from '@web/DeviceUtil'
    import {gtag} from "@web/analytics"

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
        },
        props: {
            promptContentEntryId: String,
            isModal: {type: Boolean, default: false},
            onClose: {
                type: Function, default: function () {
                    removeQueryParam(QueryParam.CONTENT_INDEX);
                    this.$emit("close")
                }
            }
        },
        async created(): Promise<void> {

            this.keyboardListener = (evt: KeyboardEvent) => {
                console.log("keyboard event listener, navigation disabled: ", this.navigationDisabled)
                if (this.navigationDisabled) {
                    console.log("navigation disabled");
                    return;
                }
                if (evt.code === "ArrowLeft" || evt.keyCode === 37) {
                    this.previous()
                }
                if (evt.code === "ArrowRight" || evt.keyCode === 39) {
                    this.next();
                }
            };

            document.addEventListener('keyup', this.keyboardListener);


            this.memberUnsubscriber = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: ({member}) => {
                    this.authLoaded = true;
                    this.member = member;
                }
            });

            this.popStateListener = window.addEventListener('popstate', (event: PopStateEvent) => {
                console.log("Window popstate called", event);
                const paramIndex = getQueryParam(QueryParam.CONTENT_INDEX);

                if (paramIndex && !isNaN(Number(paramIndex))) {
                    const index = Number(paramIndex);
                    if (index !== this.activeIndex) {
                        if (index < this.activeIndex) {
                            this.transitionName = "slide-out";
                        } else {
                            this.transitionName = "slide";
                        }

                        this.activeIndex = index;
                    }
                }

            }, false);

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
                    this.updateDocumentTitle();

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

            if (this.popStateListener) {
                window.removeEventListener("popstate", this.popStateListener);
            }

            document.removeEventListener('keyup', this.keyboardListener);

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
            touchStart: MouseEvent | undefined,
            cardStyles: any,
            popStateListener: any | undefined,
            keyboardListener: any | undefined,
            navigationDisabled: boolean,
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
                touchStart: undefined,
                cardStyles: {},
                popStateListener: undefined,
                keyboardListener: undefined,
                navigationDisabled: false,
            };
        },
        computed: {
            showCloseButton():boolean {
                return this.isModal && !this.showSharing
            },
            slideNumberClass(): string {
                return `slide-${this.activeIndex}`
            },
            hasNext(): boolean {
                return this.promptContent && this.promptContent.content && this.activeIndex < this.promptContent.content.length - 1 || false
            },
            isLastCard(): boolean {
                return this.promptContent && this.promptContent.content && this.activeIndex === this.promptContent.content.length - 1 || false
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
            },
            tapAnywhereEnabled(): boolean {
                return true
            },
        },
        watch: {
            activeIndex(index: number, oldIndex: number) {
                this.updateDocumentTitle();

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
            },

        },
        methods: {
            updateDocumentTitle() {
                const index = this.activeIndex || 0;
                let title = this.promptContent && this.promptContent.subjectLine;
                if (!title) {
                    const [firstContent]: Content[] = this.promptContent ? this.promptContent.content : [] || [];
                    title = firstContent && firstContent.text;
                }
                if (title) {
                    document.title = `Cactus | ${title} | ${index + 1}`;
                } else {
                    document.title = 'Cactus Mindful Moment'
                }
            },
            async handleTap(event: TouchEvent) {
                const excludedTags = ["INPUT", "BUTTON", "A", "TEXTAREA"];

                if (this.navigationDisabled) {
                    console.log("tap is disabled");
                    return;
                }

                if (!this.tapAnywhereEnabled) {
                    console.log("tap anywhere is disabled");
                    return;
                }
                const {width} = getDeviceDimensions();
                if (width < MOBILE_BREAKPOINT_PX) {
                    const path = event.composedPath();
                    const foundExcludedTarget = path.find((t) => {
                        const el = t as HTMLElement;
                        return !!excludedTags.includes((el.tagName || "").toUpperCase());

                    });

                    if (!foundExcludedTarget) {
                        console.log("tap event", event);
                        const touch = event.changedTouches && event.changedTouches.item(0);
                        const leftThreshold = width * .20;
                        console.log("left threshold", leftThreshold);
                        let isPrevious = false;
                        if (touch) {
                            console.log("clientX tap", touch.clientX);
                            isPrevious = touch.clientX < leftThreshold;
                        }

                        if (isPrevious) {
                            await this.previous();
                        } else {
                            await this.next();
                        }


                    }
                }
            },
            touchStartHandler(args: MouseEvent) {
                this.touchStart = args;
            },
            touchEndHandler(args: MouseEvent) {
                this.touchStart = undefined;
                this.cardStyles = {
                    transition: "all .2s",
                    // transform: `translateX(${0}px)`,
                };
            },
            touchMoveHandler(args: MouseEvent) {
                const startX = this.touchStart && this.touchStart.clientX;
                if (!startX) {
                    return;
                }

                const diffX = args.clientX - startX;
                this.cardStyles = {
                    transition: "all .2s",
                    transform: `translateX(${diffX}px)`,
                };

                console.log("Move Handler", args);
            },
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
                if (this.reflectionResponseUnsubscriber) {
                    console.log("Reflection response unsubscriber already exists, resetting in now");
                    this.reflectionResponseUnsubscriber();
                }
                let promptId = this.promptContent && this.promptContent.promptId;
                const promptContent = this.promptContent && this.promptContent.content.find(content => content.contentType === ContentType.reflect);
                const promptQuestion = promptContent ? promptContent.text : undefined;

                if (promptId) {

                    let localResponse = StorageService.getModel(LocalStorageKey.anonReflectionResponse, ReflectionResponse, promptId);
                    console.log("local response found in storage", localResponse);

                    this.reflectionResponse = localResponse;
                    this.reflectionDuration = this.reflectionResponse ? (this.reflectionResponse.reflectionDurationMs || 0) : 0;

                    // console.log("subscribing to responses for promptId", promptId);
                    this.reflectionResponseUnsubscriber = ReflectionResponseService.sharedInstance.observeForPromptId(promptId, {
                        onData: (responses) => {

                            const [first] = responses;
                            // console.log("ResponseSubscriber returned data. First in list is: ", first ? first.toJSON() : "no data");


                            if (!first && !localResponse) {
                                // console.log("No local response and no db response, creating one now");
                                // console.log("Using the newly created response for this prompt.");
                                localResponse = ReflectionResponseService.createPossiblyAnonymousReflectionResponse(promptId as string, ResponseMedium.PROMPT_WEB, promptQuestion);
                            } else if (first) {
                            }

                            if (!first && localResponse) {
                                // console.log("No data found from database, using the locally created response");
                            }

                            //TODO: combine if there are multiple?
                            const response = first || localResponse;
                            this.reflectionResponses = responses;
                            this.reflectionResponse = response;
                            this.reflectionDuration = response.reflectionDurationMs || 0;
                        }
                    })
                } else {
                    console.warn("NO prompt ID found for prompt content ", this.promptContent)
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
                    console.log("Next is disabled until the reflection is complete");
                    return;
                }

                this.transitionName = "slide";
                const saveTask = this.isReflection ? this.save() : () => undefined;
                const content = this.promptContent ? this.promptContent.content : [];
                if (this.hasNext && !this.isLastCard) {
                    this.activeIndex = Math.min(this.activeIndex + 1, content.length - 1);
                    pushQueryParam(QueryParam.CONTENT_INDEX, this.activeIndex);
                    gtag('event', 'next', {
                        event_category: "prompt_content",
                        event_label: `Slide ${this.activeIndex}`
                    });
                    await saveTask;
                } else if (this.isLastCard) {
                    await this.complete();
                }

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
                    pushQueryParam(QueryParam.CONTENT_INDEX, this.activeIndex);
                    gtag('event', 'previous', {
                        event_category: "prompt_content",
                        event_label: `Slide ${this.activeIndex}`
                    });
                }
                await saveTask;
            },
            async complete() {
                const saveTask = this.save();
                this.transitionName = "slide";
                // this.activeIndex = 0;
                pushQueryParam(QueryParam.CONTENT_INDEX, "done");
                this.completed = true;
                gtag('event', 'complete', {
                    event_category: "prompt_content",
                    event_label: `Slide ${this.activeIndex}`
                });
                await saveTask;
            },
            async restart() {
                const saveTask = this.save();
                this.activeIndex = 0;
                this.completed = false;
                await saveTask;
            },
            close() {
                gtag('event', 'close', {
                    event_category: "prompt_content",
                    event_label: `Slide ${this.activeIndex}`
                });
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
        background-color: $lightBlue;
        display: flex;
        flex-flow: column nowrap;
        flex-grow: 1;
        width: 100vw;
        justify-content: center;
        position: relative;

        @include r(600) {
            background-color: transparent;
        }

        &:not(.isModal) {
            .content-card,
            .flip-card {
                min-height: calc(100vh - 5.2rem);

                @include r(374) {
                    min-height: calc(100vh - 9rem);
                }
                @include r(600) {
                    height: 100%;
                    min-height: 0;
                }
            }
        }

        &.isModal {
            .content-card,
            .flip-card {
                min-height: 100vh;

                @include r(600) {
                    height: 100%;
                    min-height: 0;
                }
            }
        }

        @include maxW(600) {
            &.isModal {
                min-height: 100vh;

                .content-container {
                    height: 100%;
                    min-height: 0;
                }
            }
        }


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
                transform: translateY(.8rem);
                width: 94%;
                z-index: 20;
                height: 0;
                margin: 0 auto;

                @include r(600) {
                    transform: translateY(1.6rem);
                }

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
                margin: auto;
                padding: 0;
                position: absolute;
                top: 49%;
                z-index: 10;

                &.previous {
                    left: 1.6rem;
                }
                &.next {
                    right: 1.6rem;
                }

                @include r(600) {
                    @include secondaryButton;
                    align-items: center;
                    display: flex;
                    height: 4.8rem;
                    justify-content: center;
                    margin: 0 1%;
                    padding: 0;
                    top: 30vh;
                    width: 4.8rem;

                    &.previous {
                        left: -6.4rem;
                    }
                    &.next {
                        right: -6.4rem;
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
            }
        }
    }

    .shareContainer {
        left: 0;
        position: absolute;
        top: 1.6rem;
        z-index: 20;

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
        padding: 1.2rem 1.6rem;

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
        @include r(600) {
            opacity: 0;
        }

    }

    .slide-out-leave-to {
        transform: translate(100%, 0);
        @include r(600) {
            opacity: 0;
        }
    }


    //FLIPPER
    .flipper {
        position: relative;
        transform-style: preserve-3d;
        transition: 0.6s;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        width: 100%;
        z-index: 10;

        @include r(600) {
            min-height: 66rem;
            max-width: 48rem;
        }

        &.flipped {
            transform: rotateY(180deg);
        }
    }

    @keyframes twist {
        0% {
            transform: rotateY(0);
        }
        50% {
            transform: rotateY(10deg);
        }
        100% {
            transform: rotateY(0);
        }
    }

    .flip-card {
        animation: twist .5s;
        backface-visibility: hidden;
        left: 0;
        top: 0;
        width: 100%;

        @include r(600) {
            border-radius: 12px;
            height: 100%;
            min-height: 66rem;
            max-width: 48rem;
        }

        &.front {
            position: absolute;
            transform: rotateY(0);
            z-index: 2;
        }

        &.back {
            background: url(/assets/images/yellowNeedles.svg) $yellow;
            background-size: 80%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 2.4rem;
            position: relative;
            transform: rotateY(180deg);

            @include r(600) {
                border-radius: 12px;
                box-shadow: rgba(7, 69, 76, 0.18) 0 11px 28px -8px;
            }
        }
    }

</style>
