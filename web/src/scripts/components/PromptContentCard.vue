<template>
    <div class="content-card">
        <div :class="['background-image', content.backgroundImage.position]" v-if="content.backgroundImage && content.backgroundImage.imageIds && content.backgroundImage.imageIds.length > 0">
            <flamelink-image v-bind:imageId="content.backgroundImage.imageIds[0]"/>
        </div>

        <section class="content">
            <div v-if="content.text" class="text">
                <h4 v-if="content.label" class="label">{{content.label}}</h4>
                <p>{{content.text}}</p>
            </div>
            <!--    START QUOTE    -->
            <div class="quote-container" v-if="content.quote">
                <div class="avatar-container" v-if="quoteAvatarUrl">
                    <img :src="quoteAvatarUrl" :alt="content.quote.authorName"/>
                </div>
                <p class="quote">
                    {{content.quote.text}}
                </p>
                <div class="author">
                    <strong class="name">{{content.quote.authorName}}</strong>
                    <span class="title" v-if="content.quote.authorTitle">{{content.quote.authorTitle}}</span>
                </div>
            </div>
            <!--    END QUOTE    -->

            <!--    START Video -->
            <div class="video-container" v-if="content.video">
                <div v-if="content.video.youtubeEmbedUrl" class="iframe-wrapper">
                    <div class="loading" v-if="youtubeVideoLoading">
                        <spinner message="Loading Video..."/>
                    </div>
                    <iframe v-on:load="youtubeVideoLoading = false" width="320" height="203" :src="content.video.youtubeEmbedUrl" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>
                <div v-if="content.video.url">
                    <video :src="content.video.url" controls></video>
                </div>
            </div>
            <!--    END Video -->
        </section>
        <section class="bottom">
            <div class="mobile-nav-buttons" v-if="!isReflectScreen">
                <button class="next inline-arrow secondary wiggle" @click="next" v-if="hasNext">Next</button>
            </div>


            <!--    START Reflect -->
            <div v-if="isReflectScreen" class="reflect-container">
                <div class="grow-container">
                    <img src="/assets/images/cactusPots.svg" alt="Cactus Pots"/>
                </div>
                <div class="mobile-nav-buttons">
                    <button class="next inline-arrow secondary wiggle" @click="next" v-if="hasNext">Next</button>
                </div>
                <resizable-textarea v-bind:maxLines="4">
                    <textarea ref="reflectionInput" type="text" placeholder="Write your thoughts" rows="1"/>
                </resizable-textarea>

            </div>
            <!--    END Reflect-->
            <div class="actions" v-if="content.button">
                <a v-if="isLink" :href="content.button.navigation.href" :target="content.button.navigation.target">{{content.button.label}}</a>
                <button v-if="!isLink" @click="doButtonAction">{{content.button.label}}</button>
            </div>
        </section>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {Content, ContentButtonAction, ContentType} from "@shared/models/PromptContent"
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
            isLink(): boolean {
                return this.content.button && this.content.button.navigation && this.content.button.action === ContentButtonAction.navigate || false
            },
            quoteAvatarUrl(): string | undefined | null {
                if (!this.content.quote || !this.content.quote.avatarImage) {
                    return undefined;
                }

                return this.content.quote.avatarImage.url;
            },
            isReflectScreen(): boolean {
                return this.content.contentType === ContentType.reflect
            },

        },
        methods: {
            doButtonAction(): void {
                if (!this.content.button) {
                    return;
                }

                const action: ContentButtonAction = this.content.button.action;
                switch (action) {
                    case ContentButtonAction.next:
                        this.next();
                        break;
                    case ContentButtonAction.previous:
                        this.previous();
                        break;
                    case ContentButtonAction.complete:
                        this.complete();
                        break;
                    case ContentButtonAction.navigate:
                        if (this.content.button.navigation) {
                            alert(`Navigate to some page: ${this.content.button.navigation.href}`)
                        }
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

        width: 100%;
        height: 100%;
        padding: 2rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        position: relative;
        overflow-x: hidden;
        overflow-y: auto;
        align-items: center;
        text-align: center;

        .content, .bottom {
            z-index: 2;
        }


        .background-image {
            z-index: 1;
            position: absolute;

            height: 50%;

            &.top {
                top: 0;
            }

            &.bottom {
                bottom: 0;
            }

            left: 0;
            right: 0;

            overflow: hidden;

            img {
                width: 100%;
            }
        }

        .text {
            font-size: 2.6rem;

        }

        .label {
            color: $darkestPink;
            margin-bottom: 1rem;
        }


        .content {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;

            .quote-container {
                display: flex;
                flex-direction: column;

                .avatar-container {
                    $avatarSize: 6rem;

                    img {
                        height: $avatarSize;
                        width: $avatarSize;
                    }
                }

                .quote {
                    font-size: 2.4rem;
                    padding: 0 4rem;

                    &:before, &:after {
                        content: "\"";
                        font-size: 3rem;
                    }
                }

                .author {
                    margin-top: 1.5rem;
                    display: flex;
                    flex-direction: column;

                    .name {
                        /*font-weight: 400;*/
                    }

                    .title {
                        color: $lightText;
                    }
                }
            }

            .video-container {
                margin-top: 2rem;

                .iframe-wrapper {
                    position: relative;
                    padding-bottom: 56.25%; //makes a 16:9 aspect ratio
                    padding-top: 2.5rem;

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

        .bottom {
            .mobile-nav-buttons {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 1rem;
                @include minW($widthTablet) {
                    display: none;
                }

                .inline-arrow {
                    flex-grow: 0;

                    &.next {
                    }


                }
            }
        }

        .reflect-container {
            textarea {
                width: 100%;
                @include textArea;
                font-size: 1.4rem;
            }
        }


    }
</style>