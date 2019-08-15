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
                <div class="shareContainer">
                    <button class="share tertiary wiggle">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="22">
                            <path fill="#29A389" d="M8.5 2.207L5.354 5.354a.5.5 0 1 1-.708-.708l4-4a.5.5 0 0 1 .708 0l4 4a.5.5 0 0 1-.708.708L9.5 2.207V14a.5.5 0 1 1-1 0V2.207zM.5 11a.5.5 0 1 1 1 0v8A1.5 1.5 0 0 0 3 20.5h12a1.5 1.5 0 0 0 1.5-1.5v-8a.5.5 0 1 1 1 0v8a2.5 2.5 0 0 1-2.5 2.5H3A2.5 2.5 0 0 1 .5 19v-8z"/>
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                        <path fill="#29A389" d="M2.207 7.5l6.147-6.146a.5.5 0 1 0-.708-.708l-7 7a.5.5 0 0 0 0 .708l7 7a.5.5 0 0 0 .708-.708L2.207 8.5H15a.5.5 0 0 0 0-1H2.207z"/>
                    </svg>
                </button>
                <button class="next arrow secondary" @click="next" v-show="hasNext && activeIndex > 0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                        <path fill="#29A389" d="M2.207 7.5l6.147-6.146a.5.5 0 1 0-.708-.708l-7 7a.5.5 0 0 0 0 .708l7 7a.5.5 0 0 0 .708-.708L2.207 8.5H15a.5.5 0 0 0 0-1H2.207z"/>
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
        ContentButtonAction,
        ContentImagePosition,
        ContentType
    } from '@shared/models/PromptContent'
    import Spinner from "@components/Spinner.vue";
    import Vue2TouchEvents from 'vue2-touch-events'
    import {getQueryParam, updateQueryParam} from '@web/util'
    import {QueryParam} from "@shared/util/queryParams"


    Vue.use(Vue2TouchEvents);


    export default Vue.extend({
        components: {
            ContentCard,
            Spinner,
            Celebrate,
        },
        props: {
            promptId: String,
        },
        async created(): Promise<void> {
            //get content
            let promptId = this.promptId;
            if (!this.promptId) {
                promptId = window.location.pathname.split(`${PageRoute.PROMPTS_ROOT}/`)[1];
                console.log("using path for prompt id", promptId);
            } else {
                console.log("using prop for prompt id", promptId)
            }


            const mockPrompt = new PromptContent();
            mockPrompt.id = "fake_id";
            mockPrompt.promptId = promptId;
            mockPrompt.content = [
                {
                    contentType: ContentType.content,
                    label: "Day 1 of 4 about nature",
                    text: "Today you'll reflect on your favorite thing to do on a sunny day.",
                    backgroundImage: {
                        position: ContentImagePosition.bottom,
                        image: {
                            url: "/assets/images/nature.svg",
                        },
                    },
                    button: {
                        action: ContentButtonAction.next,
                        label: "Let's Go"
                    }
                },
                {
                    contentType: ContentType.content,
                    quote: {
                        text: "Everything magical happens between June and August",
                        authorName: "Jenny Han",
                        authorTitle: "Author",
                        avatarImage: {
                            url: "/assets/images/cameron.svg"
                        }
                    }
                },
                {
                    contentType: ContentType.content,
                    text: "Exposure to sunshine can increase your life satisfaction.",
                    video: {
                        youtubeEmbedUrl: "https://www.youtube.com/embed/OordOJDwV10",
                    }
                },
                {
                    label: "Reflect",
                    contentType: ContentType.reflect,
                    text: "What's your favorite thing to do on a sunny day?",
                },
                {
                    contentType: ContentType.intention,
                    text: "Find time today to appreciate and enjoy the benefits of sunny days",
                    button: {
                        action: ContentButtonAction.complete,
                        label: "Done!"
                    }
                }
            ];


            setTimeout(() => {
                this.activeIndex = Math.min(mockPrompt.content.length - 1, Number(getQueryParam(QueryParam.CONTENT_INDEX) || 0));
                this.prompt = mockPrompt;

                this.loading = false;
            }, 1500)

        },
        data(): {
            prompt: any | undefined,
            loading: boolean,
            activeIndex: number,
            activeContent: Content | undefined,
            transitionName: string,
            completed: boolean,
        } {
            return {
                prompt: undefined,
                loading: true,
                activeIndex: 0,
                activeContent: undefined,
                transitionName: "slide",
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
                alert("Will close this and redirect?");
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
                    background-color: $lightPink;

                    &:not(:last-child) {
                        border-right: 1px solid $lightBlue;
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

                &.next svg {
                    transform: scale(-1);
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
    }

    .slide-leave-to {
        opacity: 0;
        transform: translate(-100%, 0);
    }


    .slide-out-leave-active,
    .slide-out-enter-active {
        opacity: 1;
        transition: .2s ease-in-out;
    }

    .slide-out-enter {
        opacity: 0;
        transform: translate(-100%, 0);
    }

    .slide-out-leave-to {
        opacity: 0;
        transform: translate(100%, 0);
    }
</style>
