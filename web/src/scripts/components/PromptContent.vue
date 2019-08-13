<template>

    <div class="page-wrapper">
        <button class="share tertiary" v-if="!loading">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="22"><path fill="#29A389" d="M8.5 2.207L5.354 5.354a.5.5 0 1 1-.708-.708l4-4a.5.5 0 0 1 .708 0l4 4a.5.5 0 0 1-.708.708L9.5 2.207V14a.5.5 0 1 1-1 0V2.207zM.5 11a.5.5 0 1 1 1 0v8A1.5 1.5 0 0 0 3 20.5h12a1.5 1.5 0 0 0 1.5-1.5v-8a.5.5 0 1 1 1 0v8a2.5 2.5 0 0 1-2.5 2.5H3A2.5 2.5 0 0 1 .5 19v-8z"/></svg>Share Today's Prompt
        </button>
        <transition appear name="fade-in" mode="out-in">
            <spinner v-if="loading" message="Loading..."/>
            <div v-if="!loading && !prompt">
                No prompt found for id
            </div>

            <section class="content-container centered" v-if="!loading">
                <div class="progress">
                    <span v-for="(content, index) in prompt.content" :class="['segment', {complete: index <= activeIndex}]"></span>
                </div>
                <transition :name="transitionName" mode="out-in">

                    <div class="card-container" v-bind:key="activeIndex">
                        <content-card
                                v-touch:swipe.left="next"
                                v-touch:swipe.right="previous"
                                v-bind:content="prompt.content[activeIndex]"
                                v-bind:hasNext="hasNext && activeIndex > 0"
                                v-on:next="next"
                                v-on:previous="previous"
                                v-on:complete="complete"/>
                    </div>

                </transition>
                <button class="previous arrow secondary" @click="previous" v-if="hasPrevious">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><path fill="#29A389" d="M2.207 7.5l6.147-6.146a.5.5 0 1 0-.708-.708l-7 7a.5.5 0 0 0 0 .708l7 7a.5.5 0 0 0 .708-.708L2.207 8.5H15a.5.5 0 0 0 0-1H2.207z"/></svg>
                </button>
                <button class="next arrow secondary" @click="next" v-if="hasNext && activeIndex > 0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><path fill="#29A389" d="M2.207 7.5l6.147-6.146a.5.5 0 1 0-.708-.708l-7 7a.5.5 0 0 0 0 .708l7 7a.5.5 0 0 0 .708-.708L2.207 8.5H15a.5.5 0 0 0 0-1H2.207z"/>
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
    import PromptContent, {
        Content,
        ContentButtonAction,
        ContentImagePosition,
        ContentType
    } from '@shared/models/PromptContent'
    import Spinner from "@components/Spinner.vue";
    import Vue2TouchEvents from 'vue2-touch-events'


    Vue.use(Vue2TouchEvents);


    export default Vue.extend({
        components: {
            ContentCard,
            Spinner,
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
        } {
            return {
                prompt: undefined,
                loading: true,
                activeIndex: 0,
                activeContent: undefined,
                transitionName: "slide"
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
                if (this.hasPrevious) {
                    console.log("this.hasPrevious is true");
                    this.activeIndex = Math.max(this.activeIndex - 1, 0);
                }
                console.log(`new active index is ${this.activeIndex}`)
            },
            complete() {
                alert("Complete!")
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "variables";
    @import "mixins";
    /*@import "transitions";*/

    .page-wrapper {
        display: flex;
        flex-flow: column nowrap;
        justify-content: center;
        position: relative;

        .content-container {
            margin-bottom: 12rem;

            .progress {
                display: flex;
                margin: 0 auto;
                position: relative;
                transform: translateY(1.6rem);
                width: 94%;
                z-index: 5;

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

            .card-container {
            }

            .arrow {
                align-items: center;
                display: flex;
                height: 4.8rem;
                left: 0;
                justify-content: center;
                margin: auto;
                padding: 0;
                position: absolute;
                right: 0;
                top: 32vh;
                width: 4.8rem;
                z-index: 10;

                svg {
                    height: 1.6rem;
                    width: 1.6rem;
                }

                &.previous {
                    transform: translateX(-32rem);
                }

                &.next {
                    transform: translateX(32rem);

                    svg {
                        transform: scale(-1);
                    }
                }
            }
        }
    }

    button.share {
        align-items: center;
        display: flex;
        left: 0;
        position: absolute;
        top: 0;

        @include r(600) {
            position: static;
        }

        &:hover {
            background-color: transparent;
        }

        svg {
            margin-right: .8rem;
        }
    }

    button.secondary {
        margin-right: .8rem;
        transition: all .2s ease;
        outline: transparent none;

        &:hover {
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
        transition: .2s;
    }

    .slide-enter {
        transform: translate(100%, 0);
    }

    .slide-leave-to {
        transform: translate(-100%, 0);
    }


    .slide-out-leave-active,
    .slide-out-enter-active {
        transition: .2s;
    }

    .slide-out-enter {
        transform: translate(-100%, 0);
    }

    .slide-out-leave-to {
        transform: translate(100%, 0);
    }
</style>
