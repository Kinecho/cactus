<template>
    <div class="page-wrapper">

        <transition appear name="fade-in" mode="out-in">
            <spinner v-if="loading" message="Loading..."/>
            <div v-if="!loading && !prompt">
                No prompt found for id
            </div>
            <section class="content-container" v-if="!loading && prompt">
                <div class="progress">
                    <span v-for="(content, index) in prompt.content" :class="['segment', {complete: index <= activeIndex}]"></span>
                </div>
                <div class="card-container">
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
                <button class="previous arrow secondary wiggle" @click="previous" v-show="hasPrevious">&larr;</button>
                <button class="next arrow secondary wiggle" @click="next" v-show="hasNext && activeIndex > 0">&rarr;
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
                    text: "Today you'll reflect on your favorite thing ot do on a sunny day.",
                    backgroundImage: {
                        position: ContentImagePosition.bottom,
                        image: {
                            url: "/assets/images/celebrate.svg",
                        },
                    },
                    button: {
                        action: ContentButtonAction.next,
                        label: "Let's go"
                    }
                },
                {
                    contentType: ContentType.content,
                    quote: {
                        text: "Every magical happens between June and August",
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

    $cardWidth: 50rem;

    .page-wrapper {
        min-height: 70vh;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;


        .content-container {
            /*overflow: hidden;*/
            @include shadowbox;
            background-color: $lightBlue;
            position: relative;

            .progress {
                display: flex;
                width: $cardWidth;
                max-width: 100vw;
                padding: 0 1rem;
                position: absolute;
                top: 3rem;
                z-index: 5;

                .segment {
                    flex-grow: 1;
                    height: .4rem;
                    background-color: $lightPink;
                    transition: all .3s;

                    &:not(:last-child) {
                        border-right: 1px solid white;
                    }

                    &.complete {
                        background-color: $darkPink;
                    }
                }
            }

            .card-container {
                height: 60rem;
                max-height: 100vh;
                width: $cardWidth;
                max-width: 100vw;
                display: flex;
                justify-content: center;
                flex-direction: column;
                align-items: center;
                overflow: hidden;
                position: relative;
            }
        }
    }


    button.secondary {
        transition: all .2s ease;
        outline: transparent none;

        &.arrow {
            $arrowWidth: 5rem;
            z-index: 10;
            margin: 0 1rem;
            flex-grow: 0;
            height: $arrowWidth;
            width: $arrowWidth;
            background-color: $white;
            display: flex;
            justify-content: center;
            align-items: center;
            position: absolute;
            top: 50%;

            &.previous {
                left: -$arrowWidth - $arrowWidth/2;
            }

            &.next {
                right: -$arrowWidth - $arrowWidth/2;
            }

            @include maxW($widthTablet) {
                display: none;
            }

        }

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