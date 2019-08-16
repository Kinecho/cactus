import {QueryParam} from '@shared/util/queryParams'
<template>
    <div class="page-wrapper">
        <transition appear name="fade-in" mode="out-in">
            <div class="centered" v-if="loading">
                <spinner message="Loading..." :delay="1000"/>
            </div>

            <div v-if="!loading && !prompt">
                No prompt found for id
            </div>

            <section class="content-container centered" v-if="!loading && prompt">
                <button class="close tertiary icon" @click="close">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14">
                        <path fill="#29A389" d="M8.414 7l5.293 5.293a1 1 0 0 1-1.414 1.414L7 8.414l-5.293 5.293a1 1 0 1 1-1.414-1.414L5.586 7 .293 1.707A1 1 0 1 1 1.707.293L7 5.586 12.293.293a1 1 0 0 1 1.414 1.414L8.414 7z"/>
                    </svg>
                </button>
                <div class="shareContainer">
                    <button class="share tertiary wiggle">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 22">
                            <path fill="#29A389" d="M10 3.414V14a1 1 0 0 1-2 0V3.414L5.707 5.707a1 1 0 0 1-1.414-1.414l4-4a1 1 0 0 1 1.414 0l4 4a1 1 0 1 1-1.414 1.414L10 3.414zM0 11a1 1 0 0 1 2 0v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8a1 1 0 0 1 2 0v8a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3v-8z"/>
                        </svg>
                        <span class="buttonText">Share Today's Prompt</span>
                    </button>
                </div>
                <div class="progress" v-if="!completed">
                    <span v-for="(content, index) in prompt.content" :class="['segment', {complete: index <= activeIndex}]"></span>
                </div>
                <div v-if="!completed">
                    <transition :name="transitionName" mode="out-in">
                        <content-card

                                v-bind:key="activeIndex"
                                v-touch:swipe.left="next"
                                v-touch:swipe.right="previous"
                                v-bind:content="prompt.content[activeIndex]"
                                v-bind:hasNext="hasNext && activeIndex > 0"
                                v-on:next="next"
                                v-on:previous="previous"
                                v-on:complete="complete"/>
                    </transition>
                </div>
                <div v-if="completed">
                    <transition name="celebrate" appear mode="out-in">
                        <celebrate v-on:back="completed = false" v-on:restart="restart" v-on:close="close"/>
                    </transition>
                </div>


                <button class="previous arrow secondary" @click="previous" v-show="hasPrevious">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                        <path fill="#29A389" d="M12.586 7L7.293 1.707A1 1 0 0 1 8.707.293l7 7a1 1 0 0 1 0 1.414l-7 7a1 1 0 1 1-1.414-1.414L12.586 9H1a1 1 0 1 1 0-2h11.586z"/>
                    </svg>
                </button>
                <button class="next arrow secondary" @click="next" v-show="hasNext && activeIndex > 0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                        <path fill="#29A389" d="M12.586 7L7.293 1.707A1 1 0 0 1 8.707.293l7 7a1 1 0 0 1 0 1.414l-7 7a1 1 0 1 1-1.414-1.414L12.586 9H1a1 1 0 1 1 0-2h11.586z"/>
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
    import PromptContent, {
        Content,
    } from '@shared/models/PromptContent'
    import Spinner from "@components/Spinner.vue";
    import Vue2TouchEvents from 'vue2-touch-events'
    import {getFlamelink} from '@web/firebase'
    import {ListenerUnsubscriber} from '@web/services/FirestoreService'
    import {getQueryParam, updateQueryParam} from '@web/util'
    import {QueryParam} from "@shared/util/queryParams"

    const flamelink = getFlamelink();
    Vue.use(Vue2TouchEvents);


    export default Vue.extend({
        components: {
            ContentCard,
            Spinner,
            Celebrate,
        },
        props: {
            promptContentId: String,
            onClose: {
                type: Function, default: function () {
                    this.$emit("close")
                }
            }
        },
        async created(): Promise<void> {
            let promptContentId = this.promptContentId;
            if (!this.promptContentId) {
                promptContentId = window.location.pathname.split(`${PageRoute.PROMPTS_ROOT}/`)[1];
                console.log("using path for promptContentId", promptContentId);
            } else {
                console.log("using prop for promptContentId", promptContentId)
            }

            const slideNumber = Number(getQueryParam(QueryParam.CONTENT_INDEX) || 0);

            //TODO: use a promptContentService
            this.promptsUnsubscriber = await flamelink.content.subscribe({
                entryId: promptContentId,
                schemaKey: "promptContent",
                populate: [{
                    field: 'content',
                    subFields: [{field: 'backgroundImage', subFields: "imageIds"}]
                }],
                callback: (error: any, prompt: PromptContent) => {
                    if (error) {
                        this.loading = false;
                        return console.error("Failed to load prompts", error)
                    }
                    console.log("prompt", prompt);
                    if (slideNumber > prompt.content.length) {

                    }
                    this.activeIndex = (slideNumber > prompt.content.length - 1) ? 0 : slideNumber;
                    updateQueryParam(QueryParam.CONTENT_INDEX, this.activeIndex);
                    this.prompt = prompt;
                    this.loading = false;

                    const [firstContent] = prompt.content;
                    if (firstContent && firstContent.text){
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
        },
        data(): {
            prompt: any | undefined,
            loading: boolean,
            activeIndex: number,
            activeContent: Content | undefined,
            transitionName: string,
            completed: boolean,
            promptsUnsubscriber: ListenerUnsubscriber | undefined,
        } {
            return {
                prompt: undefined,
                loading: true,
                activeIndex: 0,
                activeContent: undefined,
                transitionName: "slide",
                promptsUnsubscriber: undefined,
                completed: false,
            };
        },
        computed: {
            hasNext(): boolean {
                return this.prompt && this.prompt.content && this.activeIndex < this.prompt.content.length - 1
            },
            hasPrevious(): boolean {
                return this.activeIndex > 0;
            }
        },
        watch: {
            activeIndex(index: number) {
                updateQueryParam(QueryParam.CONTENT_INDEX, index)
            },
        },
        methods: {
            next() {
                this.transitionName = "slide";
                console.log("going to next");
                const content = this.prompt ? this.prompt.content : [];
                if (this.hasNext) {
                    console.log("this.hasNext is true");
                    this.activeIndex = Math.min(this.activeIndex + 1, content.length - 1);
                }
                console.log(`new active index is ${this.activeIndex}`)
            },
            previous() {
                console.log("going to previous");
                this.transitionName = "slide-out";

                if (this.completed) {
                    this.completed = false;
                    return;
                }

                if (this.hasPrevious) {
                    console.log("this.hasPrevious is true");
                    this.activeIndex = Math.max(this.activeIndex - 1, 0);
                }
                console.log(`new active index is ${this.activeIndex}`)
            },
            complete() {
                this.transitionName = "slide";
                this.completed = true;
            },
            restart() {
                this.activeIndex = 0;
                this.completed = false;
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
        height: 100vh;
        justify-content: center;
        overflow: hidden;
        position: relative;

        .content-container {

            @include r(600) {
                margin-bottom: 12rem;
            }

            .progress {
                display: flex;
                margin: 0 auto;
                position: relative;
                transform: translateY(1.6rem);
                width: 94%;
                z-index: 5;
                height: 0;

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
                    top: 44vh;
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
                    height: 1.6rem;
                    width: 1.6rem;
                }

                &.previous svg {
                    transform: scale(-1);
                }
            }
        }
    }

    .close {
        height: 4.8rem;
        position: absolute;
        right: 0.8rem;
        top: 2.4rem;
        width: 4.8rem;
        z-index: 10;

        @include r(600) {
            right: 1.6rem;
            top: 1.6rem;
        }

        svg {
            height: 1.8rem;
            width: 1.8rem;
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

    button.secondary {
        transition: all .2s ease;
        outline: transparent none;

        &:hover {
            background-color: $lightGreen;

            svg {
                fill: $darkestGreen;
            }
        }
    }

    .wiggle:hover svg {
        animation: wiggle .5s forwards;
    }


    .slide-leave-active,
    .slide-enter-active {
        opacity: 1;
        transition: .2s ease-in-out;
    }

    .slide-enter {
        opacity: 0;
        transform: translate(100%, 0);
        opacity: 0;
    }

    .slide-leave-to {
        opacity: 0;
        transform: translate(-100%, 0);
        opacity: 0;
    }


    .slide-out-leave-active,
    .slide-out-enter-active {
        opacity: 1;
        transition: .2s ease-in-out;
    }

    .slide-out-enter {
        opacity: 0;
        transform: translate(-100%, 0);
        opacity: 0;
    }

    .slide-out-leave-to {
        opacity: 0;
        transform: translate(100%, 0);
        opacity: 0;
    }
</style>
