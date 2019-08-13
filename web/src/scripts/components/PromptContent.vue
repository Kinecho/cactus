<template>

    <div class="page-wrapper">

        <transition appear name="fade-in" mode="out-in">
            <spinner v-if="loading" message="Loading..."/>
            <div v-if="!loading && !prompt">
                No prompt found for id
            </div>
            <section class="content-container" v-if="!loading">

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
                <button class="previous arrow secondary wiggle" @click="previous" v-if="hasPrevious">Previous</button>
                <button class="next arrow secondary wiggle" @click="next" v-if="hasNext && activeIndex > 0">Next
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
                // {
                //     contentType: ContentType.content,
                //     label: "Day 1 of 4 about nature",
                //     text: "Today you'll reflect on your favorite thing ot do on a sunny day.",
                //     backgroundImage: {
                //         position: ContentImagePosition.bottom,
                //         image: {
                //             url: "/assets/images/celebrate.svg",
                //         },
                //     },
                //     button: {
                //         action: ContentButtonAction.next,
                //         label: "Let's go"
                //     }
                // },
                // {
                //     contentType: ContentType.content,
                //     quote: {
                //         text: "Every magical happens between June and August",
                //         authorName: "Jenny Han",
                //         authorTitle: "Author",
                //         avatarImage: {
                //             url: "/assets/images/cameron.svg"
                //         }
                //     }
                // },
                // {
                //     contentType: ContentType.content,
                //     text: "Exposure to sunshine can increase your life satisfaction.",
                //     video: {
                //         youtubeEmbedUrl: "https://www.youtube.com/embed/OordOJDwV10",
                //     }
                // },
                {
                    contentType: ContentType.reflect,
                    text: "What's your favorite thing to do on a sunny day?",
                },
                // {
                //     contentType: ContentType.intention,
                //     text: "Find time today to appreciate and enjoy the benefits of sunny days",
                //     button: {
                //         action: ContentButtonAction.complete,
                //         label: "Done!"
                //     }
                // }
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
    @import "transitions";

    .page-wrapper {
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;


        .content-container {

            .card-container {
                margin: 1rem 0;
                width: 100vw;
                display: flex;
                justify-content: center;
            }

            .arrow {
                position: absolute;
                top: 50vh;
                z-index: 10;

                &.previous {
                    left: 3rem;
                }

                &.next {
                    right: 3rem;
                }

                @include maxW($widthTablet) {
                    display: none;
                }
            }
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


</style>