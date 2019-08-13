<template>
    <div class="content-card">
        <div :class="['background-image', content.backgroundImage.position]" v-if="content.backgroundImage && content.backgroundImage.image && content.backgroundImage.image.url">
            <img :src="content.backgroundImage.image.url" alt="Image"/>
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
                    <p class="name">{{content.quote.authorName}}</p>
                    <p class="title" v-if="content.quote.authorTitle">{{content.quote.authorTitle}}</p>
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
        <section class="lowerActions">
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
                <button class="primaryBtn" v-if="!isLink" @click="doButtonAction">{{content.button.label}}</button>
            </div>
        </section>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {Content, ContentButtonAction, ContentType} from "@shared/models/PromptContent"
    import ResizableTextarea from "@components/ResizableTextarea.vue";
    import Spinner from "@components/Spinner.vue";

    export default Vue.extend({
        components:{
            ResizableTextarea,
            Spinner,
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
        }{
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

        .primaryBtn {
            width: 100%;

            @include r(600) {
                width: 50%;
            }
        }
    }
</style>
