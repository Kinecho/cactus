<template xmlns:v-touch="http://www.w3.org/1999/xhtml">
    <div class="page-wrapper" :class="[slideNumberClass, {isModal}]">
        <button aria-label="Close" v-if="showCloseButton && !loading && promptContent && responsesLoaded" @click="seePricingOrGoHome" title="Close" class="close tertiary icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14">
                <path fill="#29A389" d="M8.414 7l5.293 5.293a1 1 0 0 1-1.414 1.414L7 8.414l-5.293 5.293a1 1 0 1 1-1.414-1.414L5.586 7 .293 1.707A1 1 0 1 1 1.707.293L7 5.586 12.293.293a1 1 0 0 1 1.414 1.414L8.414 7z"/>
            </svg>
        </button>
        <transition appear name="fade-in" mode="out-in">
            <div v-if="show404">
                <FourOhFour/>
            </div>
            <div v-else-if="!loading && !promptContent || error" class="centered">
                <div class="alert error">
                    {{error}}
                </div>
            </div>
            <div class="centered" v-else-if="loading || !responsesLoaded">
                <spinner message="Loading..." :delay="1000"/>
            </div>
            <section class="content-container centered" v-else-if="!loading && promptContent && responsesLoaded">
                <div class="shareContainer" v-if="!completed">
                    <button aria-label="Share Today's Prompt" class="share tertiary wiggle" @click="showSharing = true" v-show="!showSharing && sharePromptEnabled">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 22" aria-hidden="true">
                            <path fill="#29A389" d="M10 3.414V14a1 1 0 0 1-2 0V3.414L5.707 5.707a1 1 0 0 1-1.414-1.414l4-4a1 1 0 0 1 1.414 0l4 4a1 1 0 1 1-1.414 1.414L10 3.414zM0 11a1 1 0 0 1 2 0v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8a1 1 0 0 1 2 0v8a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3v-8z"/>
                        </svg>
                        <span class="buttonText">Share Today's Prompt</span>
                    </button>
                    <button aria-label="Back" class="share tertiary back" @click="showSharing = false" v-show="showSharing">
                        <div class="arrow-wrapper">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18">
                                <path d="M12.586 7L7.293 1.707A1 1 0 0 1 8.707.293l7 7a1 1 0 0 1 0 1.414l-7 7a1 1 0 1 1-1.414-1.414L12.586 9H1a1 1 0 1 1 0-2h11.586z"/>
                            </svg>
                        </div>
                        <span class="buttonText">Back</span>
                    </button>
                </div>
                <div class="progress-wrapper" v-if="!completed && !showSharing && !isShareNote">
                    <div class="progress">
                        <span v-for="(content, index) in promptContent.content" :class="['segment', {complete: index <= activeIndex}]"></span>
                    </div>
                </div>

                <div :class="['flipper', {flipped: showSharing}]">
                    <div class="front flip-card" v-touch:tap="handleTap">
                        <transition :name="transitionName" mode="out-in" v-if="!completed">
                            <content-card
                                    v-bind:key="activeIndex"
                                    v-bind:cactusElement="promptContent.cactusElement"
                                    v-bind:content="contentItems[activeIndex]"
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
                                    v-on:restart="restart" v-on:close="seePricingOrGoHome"
                                    v-bind:reflectionResponse="reflectionResponse"
                                    v-bind:cactusElement="promptContent.cactusElement"
                                    v-bind:isModal="isModal"
                                    @navigationDisabled="navigationDisabled = true"
                                    @navigationEnabled="navigationDisabled = false"
                                    :promptContent="promptContent"
                            />
                        </transition>
                    </div>
                    <div class="back flip-card">
                        <prompt-content-sharing v-bind:promptContent="promptContent"/>
                    </div>
                </div>

                <button aria-label="Previous slide" class="previous arrow tertiary" @click="previous" v-show="hasPrevious && !showSharing && !completed">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                        <path d="M12.586 7L7.293 1.707A1 1 0 0 1 8.707.293l7 7a1 1 0 0 1 0 1.414l-7 7a1 1 0 1 1-1.414-1.414L12.586 9H1a1 1 0 1 1 0-2h11.586z"/>
                    </svg>
                </button>
                <button aria-label="Next slide" :class="['next', 'arrow', 'tertiary', {reflection: isReflection, complete: reflectionComplete}]"
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
    import {Config} from "@web/config";
    import {PageRoute} from '@shared/PageRoutes'
    import ContentCard from "@components/PromptContentCard.vue"
    import Celebrate from "@components/ReflectionCelebrateCard.vue";
    import PromptContent, {Content, ContentType} from '@shared/models/PromptContent'
    import {CactusElement} from '@shared/models/CactusElement';
    import Spinner from "@components/Spinner.vue";
    import Vue2TouchEvents from 'vue2-touch-events'
    import {getFlamelink} from '@web/firebase'
    import {ListenerUnsubscriber} from '@web/services/FirestoreService'
    import {getQueryParam, pushQueryParam, removeQueryParam, updateQueryParam} from '@web/util'
    import {getCloudinaryUrlFromStorageUrl} from '@shared/util/ImageUtil'
    import {QueryParam} from "@shared/util/queryParams"
    import PromptContentSharing from "@components/PromptContentSharing.vue";
    import ReflectionResponseService from '@web/services/ReflectionResponseService'
    import ReflectionResponse, {getResponseMedium, ResponseMediumType} from '@shared/models/ReflectionResponse'
    import {MINIMUM_REFLECT_DURATION_MS} from '@web/PromptContentUtil'
    import CactusMemberService from '@web/services/CactusMemberService'
    import CactusMember from '@shared/models/CactusMember'
    import StorageService, {LocalStorageKey} from '@web/services/StorageService'
    import {getAppType, getDeviceDimensions, MOBILE_BREAKPOINT_PX} from '@web/DeviceUtil'
    import {gtag} from "@web/analytics"
    import {isBlank} from "@shared/util/StringUtil"
    import CopyService from "@shared/copy/CopyService";
    import PromptContentService from "@web/services/PromptContentService";
    import FourOhFour from "@components/404.vue"
    import Logger from "@shared/Logger";

    const logger = new Logger("PromptContent.vue");
    const flamelink = getFlamelink();
    Vue.use(Vue2TouchEvents);

    const MIN_REFLECTION_MS = MINIMUM_REFLECT_DURATION_MS;
    const REFLECT_UPDATE_INTERVAL_MS = 100;
    const copy = CopyService.getSharedInstance().copy;
    export default Vue.extend({
        components: {
            ContentCard,
            Spinner,
            Celebrate,
            PromptContentSharing,
            FourOhFour
        },
        props: {
            initialIndex: Number,
            promptContentEntryId: String,
            isModal: {type: Boolean, default: false},
            onClose: {
                type: Function, default: function () {
                    removeQueryParam(QueryParam.CONTENT_INDEX);
                    this.$emit("close")
                }
            }
        },
        async beforeMount(): Promise<void> {

            this.usePromptId = !!getQueryParam(QueryParam.USE_PROMPT_ID);

            this.keyboardListener = (evt: KeyboardEvent) => {
                if (this.navigationDisabled) {
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

                    if (!this.member) {
                        const afterLoginUrl = window.location.href;
                        window.location.href = `${PageRoute.LOGIN}?${QueryParam.REDIRECT_URL}=${encodeURIComponent(afterLoginUrl)}`;
                    }
                }
            });

            this.popStateListener = window.addEventListener('popstate', (event: PopStateEvent) => {
                const paramIndex = getQueryParam(QueryParam.CONTENT_INDEX);
                if (paramIndex === "done") {
                    this.completed = true;
                    return;
                }
                this.completed = false;
                let nextIndex: number | undefined = undefined;
                if (paramIndex === "share" && this.contentItems) {
                    nextIndex = Math.max(this.contentItems.length - 1, 0);
                } else if (paramIndex && !isNaN(Number(paramIndex))) {
                    nextIndex = Number(paramIndex)
                }

                if (nextIndex !== undefined) {
                    if (nextIndex !== this.activeIndex) {
                        if (nextIndex < this.activeIndex) {
                            this.transitionName = "slide-out";
                        } else {
                            this.transitionName = "slide";
                        }

                        this.activeIndex = nextIndex;
                    }
                }

            }, false);

            let promptContentId = this.promptContentEntryId;
            if (!this.promptContentEntryId) {
                promptContentId = window.location.pathname.split(`${PageRoute.PROMPTS_ROOT}/`)[1];
                logger.log("using path for promptContentId", promptContentId);
            } else {
                logger.log("using prop for promptContentId", promptContentId)
            }

            let slideParam = getQueryParam(QueryParam.CONTENT_INDEX);
            let slideNumber = 0;
            let isDone = slideParam === "done";
            let isShare = slideParam === "share";

            try {
                slideNumber = Number(getQueryParam(QueryParam.CONTENT_INDEX) || 0);
            } catch {
                slideNumber = 0;
            }


            const flamelinkOptions = {
                onData: async (promptContent?: PromptContent | undefined, error?: any) => {
                    if (!promptContent) {
                        this.error = "This prompt does not exist";
                        this.loading = false;
                        this.promptContent = undefined;
                        this.show404 = true;
                        return;
                    }

                    if (error) {
                        this.promptContent = undefined;
                        this.loading = false;
                        this.error = "Oops! We were unable to load the prompt. Please try again later.";
                        this.show404 = false;
                        logger.error("Failed to load prompts", error);
                        return;
                    }
                    // logger.log("raw promptContent data", data);

                    // const promptContent = new PromptContent(data);
                    this.promptContent = promptContent;
                    logger.log("on load - promptContentLength", promptContent.content && promptContent.content.length);
                    if (isShare) {
                        logger.log("setting pendingActiveIndex to promptContent.content.length");
                        this.pendingActiveIndex = promptContent.content.length
                    } else if (isDone) {
                        this.completed = true;
                    } else if (this.initialIndex) {
                        this.activeIndex = this.initialIndex;
                    } else if (slideNumber < promptContent.content.length - 1) {
                        this.activeIndex = slideNumber;
                    }

                    if (!this.pendingActiveIndex && !isDone) {
                        updateQueryParam(QueryParam.CONTENT_INDEX, this.activeIndex);
                    }


                    this.loading = false;
                    this.updateDocumentMeta();
                }
            };

            if (this.usePromptId) {
                //this is to handle a case where we didn't know the prompt ID ahead of time
                this.promptsUnsubscriber = PromptContentService.sharedInstance.observeByPromptId(promptContentId, flamelinkOptions)
            } else {
                //this is the default behavior
                this.promptsUnsubscriber = PromptContentService.sharedInstance.observeByEntryId(promptContentId, flamelinkOptions)
            }
        },
        destroyed() {
            if (this.promptsUnsubscriber) {
                logger.log("Unsubscribing from flamelink promptContent listener");
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
            error: string | undefined,
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
            responsesLoaded: boolean,
            pendingActiveIndex: number | undefined,
            usePromptId: boolean,
            show404: boolean,
            hasSeenPricing: boolean
        } {
            return {
                error: undefined,
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
                responsesLoaded: false,
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
                pendingActiveIndex: undefined,
                usePromptId: false,
                show404: false,
                hasSeenPricing: false
            };
        },
        computed: {
            contentItems(): Content[] | undefined {
                if (!this.promptContent) {
                    return;
                }

                const items = [...this.promptContent.content];

                logger.log("this.promptContent.shareReflectionCopy_md", this.promptContent.shareReflectionCopy_md);

                // if (this.reflectionResponse && !isBlank(this.reflectionResponse.content.text)) {
                //     let shareReflectionCopy = isBlank(this.promptContent.shareReflectionCopy_md) ? copy.prompts.SHARE_PROMPT_COPY_MD : this.promptContent.shareReflectionCopy_md;
                //     const sharingCard: Content = {
                //         contentType: ContentType.share_reflection,
                //         text_md: shareReflectionCopy,
                //         title: copy.prompts.SHARE_YOUR_NOTE,
                //     };
                //     logger.log("adding share card to content items");
                //     items.push(sharingCard);
                // }


                return items;

            },
            isShareNote(): boolean {
                if (this.contentItems && this.contentItems.length > this.activeIndex) {
                    const activeContent = this.contentItems[this.activeIndex];
                    return activeContent.contentType === ContentType.share_reflection || false;
                }
                return false;
            },
            showCloseButton(): boolean {
                return !this.showSharing;
            },
            slideNumberClass(): string {
                return `slide-${this.activeIndex}`
            },
            hasNext(): boolean {
                return this.contentItems && this.contentItems && this.activeIndex < this.contentItems.length - 1 || false
            },
            isLastCard(): boolean {
                return this.contentItems && this.activeIndex === this.contentItems.length - 1 || false
            },
            isFirstCard(): boolean {
                return this.contentItems && this.activeIndex === 0 || false
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
                if (this.contentItems && this.contentItems.length > this.activeIndex) {
                    const activeContent = this.contentItems[this.activeIndex];
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
                    logger.log("Style object", styles);
                    return styles;
                }
            },
            tapAnywhereEnabled(): boolean {
                return true;
            },
            sharePromptEnabled(): boolean {
                return !this.isShareNote;
            },
            cactusElement(): CactusElement | undefined {
                if (this.promptContent) {
                    return this.promptContent.cactusElement;
                }
            }
        },
        watch: {
            responsesLoaded(loaded) {
                // logger.log("responses loaded. Pending Active Index is", this.pendingActiveIndex, "contentItems.length", this.contentItems && this.contentItems.length)
                // if (loaded && this.pendingActiveIndex !== undefined) {
                //     if (this.contentItems && this.contentItems.length > 0) {
                //         this.activeIndex = Math.min(Math.max(0, this.contentItems.length - 1), this.pendingActiveIndex)
                //         // updateQueryParam(QueryParam.CONTENT_INDEX, this.activeIndex);
                //     }
                // }
            },
            activeIndex(index: number, oldIndex: number) {
                this.updateDocumentMeta();

                if (this.contentItems && this.contentItems.length > index) {
                    const activeContent = this.contentItems[index];
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
            async updatePendingActiveIndex(reflection?: ReflectionResponse) {
                logger.log("Update pending active index");
                if (reflection && !isBlank(reflection.content.text) && this.pendingActiveIndex !== undefined) {
                    if (this.promptContent && this.promptContent.content.length > 0) {
                        logger.log("Setting active index in pending active index method");
                        this.activeIndex = Math.min(this.promptContent.content.length, this.pendingActiveIndex);
                    }
                } else if (!this.completed) {
                    updateQueryParam(QueryParam.CONTENT_INDEX, this.activeIndex);
                }


            },
            updateDocumentMeta() {
                const index = this.activeIndex || 0;
                let title = this.promptContent && this.promptContent.subjectLine;
                let openGraphImage = this.promptContent && this.promptContent.openGraphImage;
                let ogTitleTag = document.querySelector("meta[property='og:title']");
                let twitterTitleTag = document.querySelector("meta[name='twitter:title']");
                let ogDescriptionTag = document.querySelector("meta[property='og:description']");
                let twitterDescriptionTag = document.querySelector("meta[name='twitter:description']");
                let ogImageTag = document.querySelector("meta[property='og:image']");
                let twitterImageTag = document.querySelector("meta[name='twitter:image']");

                if (!title) {
                    const [firstContent]: Content[] = this.promptContent ? this.promptContent.content : [] || [];
                    title = firstContent && firstContent.text;
                }
                if (title) {
                    document.title = `${title} | ${index + 1}`;
                } else {
                    document.title = 'Cactus Mindful Moment'
                }
                if (ogTitleTag) {
                    ogTitleTag.setAttribute("content", `${title}`);
                    if (twitterTitleTag) {
                        twitterTitleTag.setAttribute("content", `${title}`);
                    }
                }
                if (ogDescriptionTag) {
                    ogDescriptionTag.setAttribute("content", `Reflect on this mindful moment from Cactus.`);
                    if (twitterDescriptionTag) {
                        twitterDescriptionTag.setAttribute("content", `Reflect on this mindful moment from Cactus.`);
                    }
                }

                if (!openGraphImage || !openGraphImage.storageUrl) {
                    const [firstContent]: Content[] = this.promptContent ? this.promptContent.content : [] || [];
                    openGraphImage = firstContent && firstContent.backgroundImage;
                }

                if (ogImageTag && openGraphImage && openGraphImage.storageUrl) {
                    logger.log(openGraphImage.storageUrl);
                    let pngUrl = getCloudinaryUrlFromStorageUrl({
                        storageUrl: openGraphImage.storageUrl,
                        width: 1200,
                        transforms: ["w_1200", "h_630", "f_png", "c_lpad"]
                    });
                    ogImageTag.setAttribute("content", `${pngUrl}`);

                    if (twitterImageTag) {
                        twitterImageTag.setAttribute("content", `${pngUrl}`);
                    }
                }
            },
            async handleTap(event: TouchEvent) {
                const excludedTags = ["INPUT", "BUTTON", "A", "TEXTAREA"];

                if (this.navigationDisabled) {
                    logger.log("tap is disabled");
                    return;
                }

                if (!this.tapAnywhereEnabled) {
                    logger.log("tap anywhere is disabled");
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
                        logger.log("tap event", event);
                        const touch = event.changedTouches && event.changedTouches.item(0);
                        const leftThreshold = width * .20;
                        logger.log("left threshold", leftThreshold);
                        let isPrevious = false;
                        if (touch) {
                            logger.log("clientX tap", touch.clientX);
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

                logger.log("Move Handler", args);
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
                    logger.log("Reflection response unsubscriber already exists, resetting in now");
                    this.reflectionResponseUnsubscriber();
                }
                let promptId = this.promptContent && this.promptContent.promptId;
                const promptContent = this.promptContent && this.promptContent.content.find(content => content.contentType === ContentType.reflect);
                const promptQuestion = promptContent ? promptContent.text : undefined;

                if (promptId) {
                    this.reflectionDuration = this.reflectionResponse ? (this.reflectionResponse.reflectionDurationMs || 0) : 0;

                    // logger.log("subscribing to responses for promptId", promptId);
                    this.reflectionResponseUnsubscriber = ReflectionResponseService.sharedInstance.observeForPromptId(promptId, {
                        onData: async (responses) => {

                            //TODO: combine if there are multiple?
                            const [first] = responses;
                            const newResponse = ReflectionResponseService.createReflectionResponse(promptId as string, getResponseMedium({
                                    app: getAppType(),
                                    type: ResponseMediumType.PROMPT
                                }), promptQuestion);

                            const response = first || newResponse;

                            if (response) {
                                await this.updatePendingActiveIndex(response);
                                this.responsesLoaded = true;
                                this.reflectionResponses = responses;
                                this.reflectionResponse = response;
                                this.reflectionDuration = response.reflectionDurationMs || 0;

                                if (this.isFirstCard && !this.saving && !this.saved) {
                                    logger.log("Attempting to save ReflectionResponse when the prompt first loaded...");
                                    const saveTask = this.save({updateReflectionLog: false});
                                    await saveTask;
                                }
                            }
                        }
                    })
                } else {
                    logger.warn("NO prompt ID found for prompt content ", this.promptContent)
                }
            },

            async save(options: { updateReflectionLog: boolean } = {updateReflectionLog: false}): Promise<ReflectionResponse | undefined> {
                if (this.reflectionResponse) {
                    this.saving = true;
                    this.saved = false;
                    this.reflectionResponse.reflectionDurationMs = this.reflectionDuration;
                    this.reflectionResponse.cactusElement = this.promptContent && this.promptContent.cactusElement || null;
                    const saved = await ReflectionResponseService.sharedInstance.save(this.reflectionResponse, {
                        saveIfAnonymous: true,
                        updateReflectionLog: options.updateReflectionLog
                    });
                    this.reflectionResponse = saved;
                    this.saved = true;
                    this.saving = false;
                    return saved;
                }
                return;
            },
            async next() {
                if (this.isReflection && !this.reflectionComplete) {
                    logger.log("Next is disabled until the reflection is complete");
                    return;
                }

                this.transitionName = "slide";
                const saveTask = this.isReflection ? this.save({updateReflectionLog: true}) : () => undefined;
                const content = this.contentItems || [];
                if (this.hasNext && !this.isLastCard) {
                    this.activeIndex = Math.min(this.activeIndex + 1, content.length - 1);

                    let nextItem = content[this.activeIndex];
                    if (nextItem && nextItem.contentType === ContentType.share_reflection) {
                        pushQueryParam(QueryParam.CONTENT_INDEX, "share");
                    } else {
                        pushQueryParam(QueryParam.CONTENT_INDEX, this.activeIndex);
                    }


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
                const saveTask = this.isReflection ? this.save({updateReflectionLog: false}) : () => undefined;
                this.transitionName = "slide-out";
                const content = this.contentItems || [];
                if (this.completed) {
                    this.activeIndex = Math.max(0, content.length - 1);
                    this.completed = false;
                    // return;
                } else if (this.hasPrevious) {
                    this.activeIndex = Math.max(this.activeIndex - 1, 0);
                }

                let previousItem = content[this.activeIndex];
                if (previousItem && previousItem.contentType === ContentType.share_reflection) {
                    pushQueryParam(QueryParam.CONTENT_INDEX, "share");
                } else {
                    pushQueryParam(QueryParam.CONTENT_INDEX, this.activeIndex);
                }


                // pushQueryParam(QueryParam.CONTENT_INDEX, this.activeIndex);
                gtag('event', 'previous', {
                    event_category: "prompt_content",
                    event_label: `Slide ${this.activeIndex}`
                });

                await saveTask;
            },
            async complete() {
                const saveTask = this.save({updateReflectionLog: true});
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
                const saveTask = this.save({updateReflectionLog: false});
                this.activeIndex = 0;
                this.completed = false;
                await saveTask;
            },
            seePricingOrGoHome(): void {
                gtag('event', 'close', {
                    event_category: "prompt_content",
                    event_label: `Slide ${this.activeIndex}`
                });
                if (this.promptContent?.documentId === Config.firstPromptId && 
                    !this.hasSeenPricing) {
                    window.location.href = PageRoute.PRICING + `?${QueryParam.ABBREVIATED}=true`;
                } else {
                    this.onClose();
                }
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
        background-color: $beige;
        display: flex;
        flex-direction: column;
        position: relative;
        width: 100vw;

        @include r(600) {
            background-color: transparent;
            padding: 6.4rem 0;
        }

        button.secondary {
            transition: all .2s ease;

            &:hover {
                background-color: $lightGreen;
            }
        }

        .content-container {
            perspective: 1000px;

            .progress-wrapper {
                left: 0;
                margin: 0 auto;
                position: absolute;
                right: 0;
                top: .4rem;
                width: 98%;
                z-index: 20;

                @include r(600) {
                    top: 5.6rem;
                    width: 94%;
                }

                .progress {
                    display: flex;

                    .segment {
                        border-radius: .8rem;
                        flex-grow: 1;
                        height: .4rem;
                        background-color: $darkestGreen;

                        &:not(:last-child) {
                            margin-right: 2px;
                        }

                        &.complete {
                            background-color: $green;
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
                padding: 1.2rem;
                position: absolute;
                top: 50%;
                z-index: 20;

                &.previous {
                    left: 0;
                }

                &.next {
                    right: 0;
                }

                @include r(600) {
                    @include secondaryButton;
                    align-items: center;
                    display: flex;
                    height: 4.8rem;
                    justify-content: center;
                    margin: 0 1%;
                    top: 30vh;
                    width: 4.8rem;

                    &.previous {
                        left: -6.4rem;
                        padding: 0;
                    }
                    &.next {
                        right: -6.4rem;
                        padding: 0;
                    }
                }

                @include r(768) {
                    margin: auto;

                    &.previous {
                        left: -11rem;
                    }
                    &.next {
                        right: -11rem;
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
        top: .8rem;
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
        padding: 1.2rem;

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

        svg {
            fill: $white;

            @include r(600) {
                fill: $darkGreen;
            }
        }
    }

    .wiggle:hover svg {
        animation: wiggle .5s forwards;
    }

    button.close {
        background-color: $beige;
        position: absolute;
        right: 0;
        top: 1.2rem;
        z-index: 20;

        @include r(600) {
            background-color: transparent;
            right: 1.6rem;
            top: 1.6rem;
        }

        svg {
            height: 1.8rem;
            width: 1.8rem;
        }
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
        transition: 0.3s;
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
            height: 100%;
            position: absolute;
            transform: rotateY(0);
            z-index: 2;
        }

        &.back {
            background-color: $darkerGreen;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 2.4rem;
            position: relative;
            transform: rotateY(180deg);
        }
    }

    .flip-card.back {
        visibility: hidden;

        .flipped & {
            visibility: visible;
        }
    }

</style>
