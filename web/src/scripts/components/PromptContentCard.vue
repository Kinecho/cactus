<template>
    <div class="content-card">
        <div :class="['background-image', processedContent.backgroundImage.position]" v-if="processedContent.backgroundImage && processedContent.backgroundImage">
            <flamelink-image v-bind:image="processedContent.backgroundImage"/>
        </div>

        <section class="content">
            <div v-if="processedContent.text" class="text">
                <h4 v-if="processedContent.label" class="label">{{processedContent.label}}</h4>
                <p>{{processedContent.text}}</p>
            </div>
            <!--    START QUOTE    -->
            <div class="quote-container" v-if="processedContent.quote">
                <div class="avatar-container" v-if="quoteAvatar">
                    <flamelink-image v-bind:image="quoteAvatar" v-bind:width="60"/>
                </div>
                <p class="quote">
                    {{processedContent.quote.text}}
                </p>
                <div class="author">
                    <p class="name">{{processedContent.quote.authorName}}</p>
                    <p class="title" v-if="processedContent.quote.authorTitle">
                        {{processedContent.quote.authorTitle}}</p>
                </div>
            </div>
            <!--    END QUOTE    -->

            <!--    START Video -->
            <div class="video-container" v-if="processedContent.video">
                <div v-if="processedContent.video.youtubeVideoId" class="iframe-wrapper">
                    <div class="loading" v-if="youtubeVideoLoading">
                        <spinner message="Loading Video..."/>
                    </div>
                    <iframe v-on:load="youtubeVideoLoading = false" width="320" height="203" :src="`https://www.youtube.com/embed/${processedContent.video.youtubeVideoId}`" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>
                <div v-if="processedContent.video.url">
                    <video :src="processedContent.video.url" controls></video>
                </div>
            </div>
            <!--    END Video -->


            <a v-if="processedContent.link" :href="processedContent.link.destinationHref" :target="processedContent.link.linkTarget" :class="[processedContent.link.style]">{{processedContent.link.linkLabel}}</a>

            <!--    START Grow -->
            <div class="grow-container" v-if="isReflectScreen">
                <img src="/assets/images/cactusPots.svg" alt="Cactus Pots"/>
            </div>
            <!--    END Grow -->
        </section>
        <section class="lowerActions">
            <div class="mobile-nav-buttons" v-if="!isReflectScreen">
                <button class="next inline-arrow secondary wiggle" @click="next" v-if="hasNext">Next</button>
            </div>


            <!--    START Reflect -->
            <div v-if="isReflectScreen" class="reflect-container">
                <div class="mobile-nav-buttons">
                    <button class="next inline-arrow secondary wiggle" @click="next" v-if="hasNext">Next</button>
                </div>
                <resizable-textarea v-bind:maxLines="4">
                    <textarea ref="reflectionInput" type="text" placeholder="Write your thoughts" rows="1"/>
                </resizable-textarea>

            </div>
            <!--    END Reflect-->
            <div class="actions" v-if="processedContent.actionButton">
                <button class="primaryBtn" @click="doButtonAction">{{processedContent.actionButton.label}}</button>
            </div>
        </section>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {Content, ContentAction, ContentType, Image as ContentImage, processContent} from "@shared/models/PromptContent"
    import ResizableTextarea from "@components/ResizableTextarea.vue";
    import Spinner from "@components/Spinner.vue";
    import FlamelinkImage from "@components/FlamelinkImage.vue";

    export default Vue.extend({
        components: {
            ResizableTextarea,
            Spinner,
            FlamelinkImage,
        },
        props: {
            content: {
                type: Object as () => Content
            },
            hasNext: Boolean,
            hasPrevious: Boolean,
        },
        data(): {
            youtubeVideoLoading: boolean
        } {
            return {
                youtubeVideoLoading: true,
            }
        },
        computed: {
            processedContent(): Content {
                return processContent(this.content);
            },
            quoteAvatar(): ContentImage | undefined | null {
                if (!this.content.quote || !this.content.quote.authorAvatar) {
                    return undefined;
                }

                return this.content.quote.authorAvatar;
            },
            isReflectScreen(): boolean {
                return this.content.contentType === ContentType.reflect
            },

        },
        methods: {
            doButtonAction(): void {
                if (!this.content.actionButton) {
                    return;
                }

                const action: ContentAction = this.content.actionButton.action;
                switch (action) {
                    case ContentAction.next:
                        this.next();
                        break;
                    case ContentAction.previous:
                        this.previous();
                        break;
                    case ContentAction.complete:
                        this.complete();
                        break;
                }

            },
            next() {
                this.$emit("next")
            },
            previous() {
                this.$emit("previous");
            },
            complete() {
                this.$emit("complete")
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "variables";
    @import "mixins";
    @import "forms";

    .content-card {
        background-color: $lightBlue;
        display: flex;
        flex-direction: column;
        height: 100vh;
        justify-content: space-between;
        padding: 2.4rem;
        width: 100%;

        @include r(600) {
            border-radius: 12px;
            box-shadow: rgba(7, 69, 76, 0.18) 0 11px 28px -8px;
            max-height: 66rem;
            max-width: 48rem;
            position: relative;
            overflow: hidden;
        }

        .content, .lowerActions {
            z-index: 2;
        }

        .background-image {
            display: flex;
            justify-content: center;
            margin: 0 -2.4rem;
            order: 1;

            &.top {
                margin-top: -2.4rem;
            }

            &.bottom {
                margin-bottom: -2.4rem;
            }

            img {
                transform: translateY(11px);
                width: 111%;
            }
        }

        .text {
            font-size: 2.4rem;
        }

        .label {
            color: $darkestPink;
            margin-bottom: 1.6rem;
        }

        .content {
            display: flex;
            flex: 1;
            flex-direction: column;
            justify-content: center;

            .quote-container {
                display: flex;
                flex-direction: column;

                .avatar-container {
                    margin-bottom: 2.4rem;

                    img {
                        $avatarSize: 5.6rem;
                        height: $avatarSize;
                        width: $avatarSize;
                    }
                }

                .quote {
                    font-size: 2.4rem;
                    margin-bottom: 2.4rem;

                    &:before, &:after {
                        content: "\"";
                    }
                }

                .name {
                    font-weight: bold;
                }

                .title {
                    opacity: .8;
                }
            }

            .video-container {
                border-radius: 12px;
                margin-top: 4rem;
                overflow: hidden;

                .iframe-wrapper {
                    position: relative;
                    padding-bottom: 56.25%; //makes a 16:9 aspect ratio
                    padding-top: 2.4rem;

                    .loading {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        z-index: 1;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }

                    iframe {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        z-index: 2;
                    }
                }
            }
        }

        .grow-container {
            img {
                max-width: 100%;
            }
        }

        .lowerActions {
            bottom: 3.2rem;
            left: 2.4rem;
            position: absolute;
            right: 2.4rem;

            .mobile-nav-buttons {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 1rem;

                @include minW($widthTablet) {
                    display: none;
                }

                .inline-arrow {
                    flex-grow: 0;
                }
            }
        }

        .reflect-container {
            textarea {
                @include textArea;
                font-family: $font-stack;
                width: 100%;
            }
        }

        .primaryBtn {
            width: 100%;

            @include r(600) {
                width: 50%;
            }
        }
    }
</style>
