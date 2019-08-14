<template>
    <div class="page-wrapper">
        <div class="shareContainer">
            <button class="share tertiary wiggle" v-if="!loading">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="22"><path fill="#29A389" d="M8.5 2.207L5.354 5.354a.5.5 0 1 1-.708-.708l4-4a.5.5 0 0 1 .708 0l4 4a.5.5 0 0 1-.708.708L9.5 2.207V14a.5.5 0 1 1-1 0V2.207zM.5 11a.5.5 0 1 1 1 0v8A1.5 1.5 0 0 0 3 20.5h12a1.5 1.5 0 0 0 1.5-1.5v-8a.5.5 0 1 1 1 0v8a2.5 2.5 0 0 1-2.5 2.5H3A2.5 2.5 0 0 1 .5 19v-8z"/></svg>
                <span class="buttonText">Share Today's Prompt</span>
            </button>
        </div>
        <transition appear name="fade-in" mode="out-in">
            <spinner v-if="loading" message="Loading..."/>
            <div v-if="!loading && !prompt">
                No prompt found for id
            </div>
            <section class="content-container centered" v-if="!loading && prompt">
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
                <button class="previous arrow secondary" @click="previous" v-show="hasPrevious">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><path fill="#29A389" d="M2.207 7.5l6.147-6.146a.5.5 0 1 0-.708-.708l-7 7a.5.5 0 0 0 0 .708l7 7a.5.5 0 0 0 .708-.708L2.207 8.5H15a.5.5 0 0 0 0-1H2.207z"/></svg>
                </button>
                <button class="next arrow secondary" @click="next" v-show="hasNext && activeIndex > 0">
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
        ContentAction,
        ContentImagePosition,
        ContentType
    } from '@shared/models/PromptContent'
    import Spinner from "@components/Spinner.vue";
    import Vue2TouchEvents from 'vue2-touch-events'
    import {getFlamelink} from '@web/firebase'
    import {ListenerUnsubscriber} from '@web/services/FirestoreService'

    const flamelink = getFlamelink();
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

            this.promptsUnsubscriber = await flamelink.content.subscribe({
                entryId: promptId,
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
                    this.prompt = prompt;
                    this.loading = false;
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
            promptsUnsubscriber: ListenerUnsubscriber | undefined,
        } {
            return {
                prompt: undefined,
                loading: true,
                activeIndex: 0,
                activeContent: undefined,
                transitionName: "slide",
                promptsUnsubscriber: undefined,
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
