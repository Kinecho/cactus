<template>

    <div class="page-wrapper">
        <div v-if="loading">Loading</div>
        <div v-if="!loading && !prompt">
            No prompt found for id
        </div>
        <section class="content-container centered" v-if="!loading">

            <transition appear name="fade-in" mode="out-in">
                <content-card
                        v-bind:content="prompt.content[activeIndex]"
                        v-bind:key="activeIndex"
                        v-on:next="next"
                        v-on:previous="previous"
                        v-on:complete="complete"/>
            </transition>
            <button class="previous arrow secondary wiggle" @click="previous" v-if="hasPrevious">Previous</button>
            <button class="next arrow secondary wiggle" @click="next" v-if="hasNext && activeIndex > 0">Next</button>
        </section>


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


    export default Vue.extend({
        components: {
            ContentCard,
        },
        async created(): Promise<void> {
            //get content

            const entryId = window.location.pathname.split(`${PageRoute.PROMPTS_ROOT}/`)[1];

            const mockPrompt = new PromptContent();
            mockPrompt.id = "fake_id";
            mockPrompt.promptId = entryId;
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
            activeContent: Content | undefined
        } {
            return {
                prompt: undefined,
                loading: true,
                activeIndex: 0,
                activeContent: undefined,
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

            .arrow {
                position: absolute;
                top: 50vh;

                &.previous {
                    left: 3rem;
                }

                &.next {
                    right: 3rem;
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