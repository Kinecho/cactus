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

            <!--      START Photo      -->
            <div class="photo-container">
                <flamelink-image v-if="processedContent.photo" v-bind:image="processedContent.photo"/>
            </div>
            <!--      END Photo      -->

            <!--    START AUDIO     -->
            <div class="audio-container" v-if="processedContent.audio">
                <audio controls :src="processedContent.audio.url"/>
            </div>
            <!--    END AUDIO     -->

            <!--      START Link      -->
            <div v-if="processedContent.link">
                <a :href="processedContent.link.destinationHref"
                        :target="processedContent.link.linkTarget"
                        :class="linkClasses">{{processedContent.link.linkLabel}}</a>
            </div>
            <!--      END Link      -->


            <!--    START Grow -->
            <div class="grow-container" v-if="isReflectScreen">
                <svg class="grow5" xmlns="http://www.w3.org/2000/svg" width="78" height="75">
                    <path fill="#000" fill-opacity=".1" d="M62.481 70c0 2.762-10.406 5-23.24 5C26.406 75 16 72.762 16 70s10.406-5 23.241-5c12.834 0 23.24 2.238 23.24 5"/>
                    <path fill="#F5DD48" d="M18.279 46.524c-1.428 2.786-2.021 5.419-2.238 8.542-.218 3.123.426 6.355 2.134 8.979 2.128 3.272 5.736 5.358 9.495 6.415 3.713 1.044 7.61 1.189 11.467 1.303 3.856-.114 7.753-.259 11.466-1.303 3.759-1.057 7.367-3.143 9.496-6.415 1.708-2.624 2.352-5.856 2.134-8.979-.218-3.123-1.48-6.515-2.906-9.302C56.304 39.864 48.042 37 39.616 37c-8.967.001-18.12 3.244-21.337 9.524"/>
                    <path fill="#000" fill-rule="nonzero" d="M47 41c11.27 13.381 12.68 26-9.215 29.245-3.659.5-5.1.751-4.323.755h7.843C68 70.245 62.274 49.437 55 41h-8z" opacity=".05"/>
                    <ellipse cx="39.5" cy="41.5" fill="#000" opacity=".407" rx="15.5" ry="2.5"/>
                    <g class="leaf1">
                        <path fill="#2DB799" d="M59.621 10.788c-2.661.759-5.463 1.031-8.037 2.046-2.575 1.015-5.008 3.021-5.473 5.75l-.748 1.713 4.347 10.025h4.324l6.656-1.637c2.828-2.755 3.879-6.856 4.268-10.785.391-3.929.253-7.94 1.249-11.76-1.235 2.476-3.924 3.889-6.586 4.648"/>
                        <path fill="#29A389" fill-rule="nonzero" d="M65.233 9.507c-7.32 16.531-16.325 23.71-27.005 21.449a.25.25 0 0 1 .104-.49C48.73 32.67 57.54 25.646 64.776 9.306a.25.25 0 0 1 .457.202z"/>
                    </g>
                    <g class="leaf2">
                        <path fill="#2DB799" d="M11.872 17.9c.39 3.929 1.441 8.03 4.268 10.785l6.656 1.637h4.324l4.347-10.025-.747-1.713c-.466-2.729-2.899-4.735-5.474-5.75-2.574-1.015-5.376-1.287-8.037-2.046-2.661-.759-5.351-2.172-6.586-4.648.997 3.82.858 7.831 1.249 11.76"/>
                        <path fill="#29A389" fill-rule="nonzero" d="M11.767 9.507c7.32 16.531 16.325 23.71 27.005 21.449a.25.25 0 0 0-.104-.49C28.27 32.67 19.46 25.646 12.224 9.306a.25.25 0 0 0-.457.202z"/>
                    </g>
                    <g class="leaf3">
                        <path fill="#30C1A2" d="M21.344 21.409c-.411 6.513 8.005 14.1 8.005 14.1 6.546-4.924 6.278-16.445 6.278-16.445.456-2.688-.335-3.552-1.633-5.698-1.298-2.144-2.985-3.885-4.413-5.903-1.426-2.018-2.627-4.459-2.658-7.178-2.595 6.825-5.111 13.723-5.579 21.124"/>
                        <path fill="#29A389" fill-rule="nonzero" d="M26.65 2.132c-.036 18.08 5.27 28.3 15.947 30.578a.25.25 0 0 0 .104-.489c-10.395-2.217-15.587-12.218-15.55-30.087a.25.25 0 0 0-.5-.002z"/>
                    </g>
                    <g class="leaf4">
                        <path fill="#30C1A2" d="M7.702 36.712c2.713 4.081 7.092 6.867 11.792 7.959 4.7 1.094 9.869.378 14.409-1.279l-6.707-13.663c-2.492-1.395-5.404-1.273-8.296-1.152-.896.037-1.788.075-2.667.067C10.306 28.594 0 22.22 0 22.22s4.772 10.082 7.702 14.492"/>
                        <path fill="#29A389" fill-rule="nonzero" d="M.814 23.387c12.07 13.46 22.853 17.505 32.31 12.054a.25.25 0 1 0-.249-.434c-9.209 5.308-19.759 1.35-31.689-11.954a.25.25 0 1 0-.372.334z"/>
                    </g>
                    <g class="leaf5">
                        <path fill="#30C1A2" d="M61.524 28.644c-.879.008-1.772-.03-2.667-.067-2.892-.121-5.805-.243-8.295 1.152l-6.708 13.663c4.54 1.657 9.71 2.373 14.409 1.279 4.7-1.092 9.08-3.878 11.793-7.959 2.929-4.41 7.702-14.492 7.702-14.492s-10.306 6.374-16.234 6.424"/>
                        <path fill="#29A389" fill-rule="nonzero" d="M77.186 23.387c-12.07 13.46-22.853 17.505-32.31 12.054a.25.25 0 1 1 .249-.434c9.209 5.308 19.759 1.35 31.689-11.954a.25.25 0 1 1 .372.334z"/>
                    </g>
                    <g class="leaf6">
                        <path fill="#30C1A2" d="M47.534 7.177c-1.427 2.019-3.115 3.76-4.412 5.905-1.298 2.145-2.09 3.009-1.634 5.697 0 0-.268 11.522 6.278 16.445 0 0 8.417-7.586 8.005-14.1C55.303 13.723 52.788 6.825 50.19 0c-.03 2.719-1.23 5.16-2.657 7.177"/>
                        <path fill="#29A389" fill-rule="nonzero" d="M50.606 2.798c.317 17.83-4.742 27.832-15.206 29.913a.25.25 0 0 1-.098-.49c10.173-2.024 15.117-11.798 14.804-29.415a.25.25 0 0 1 .5-.008z"/>
                    </g>
                    <g class="leaf7">
                        <path fill="#33CCAB" d="M35.474 5.118c-.191 2.28-.528 4.108-1.406 6.198-1.413 3.365-3.861 6.203-5.397 9.514-2.404 5.181-2.366 11.435.1 16.586 1.097 2.293 2.685 4.399 4.807 5.796 2.123 1.399 6.504 1.446 6.647 1.434 2.563-.211 5.692-2.142 7.118-4.343 1.459-2.251 2.817-4.644 3.29-7.285.976-5.434-1.947-10.806-5.384-15.128-3.436-4.322-9.585-16.193-9.585-16.193s-.184 3.353-.19 3.421"/>
                        <path fill="#29A389" fill-rule="nonzero" d="M35.9 4.198c5.101 18.755 6.004 31.707 2.732 38.83a.25.25 0 1 0 .454.209c3.336-7.262 2.427-20.31-2.704-39.17a.25.25 0 1 0-.483.131z"/>
                    </g>
                </svg>
            </div>
            <!--    END Grow -->
        </section>
        <section class="lowerActions">
            <div class="mobile-nav-buttons" v-if="!isReflectScreen">
                <button class="next inline-arrow primary" @click="next" v-if="hasNext">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                        <path fill="#fff" d="M12.586 7L7.293 1.707A1 1 0 0 1 8.707.293l7 7a1 1 0 0 1 0 1.414l-7 7a1 1 0 1 1-1.414-1.414L12.586 9H1a1 1 0 1 1 0-2h11.586z"/>
                    </svg>
                </button>
            </div>


            <!--    START Reflect -->
            <div v-if="isReflectScreen && response" class="reflect-container">
                <div class="mobile-nav-buttons">
                    <button class="next inline-arrow primary" @click="next" v-if="hasNext">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                            <path fill="#fff" d="M12.586 7L7.293 1.707A1 1 0 0 1 8.707.293l7 7a1 1 0 0 1 0 1.414l-7 7a1 1 0 1 1-1.414-1.414L12.586 9H1a1 1 0 1 1 0-2h11.586z"/>
                        </svg>
                    </button>
                </div>
                <resizable-textarea v-bind:maxLines="4">
                    <textarea ref="reflectionInput"
                            type="text"
                            placeholder="Add your reflection"
                            rows="1"
                            v-model="response.content.text"
                            v-on:input="autosave"
                    />
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
    import {
        Content,
        ContentAction,
        ContentType,
        Image as ContentImage,
        LinkStyle,
        processContent
    } from "@shared/models/PromptContent"
    import ResizableTextarea from "@components/ResizableTextarea.vue";
    import Spinner from "@components/Spinner.vue";
    import FlamelinkImage from "@components/FlamelinkImage.vue";
    import ReflectionResponse from '@shared/models/ReflectionResponse'
    import ReflectionResponseService from '@web/services/ReflectionResponseService'
    import {debounce} from "debounce";

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
            response: Object as () => ReflectionResponse
        },
        data(): {
            youtubeVideoLoading: boolean,
            editingResponse: string,
            saving: boolean,
        } {
            return {
                youtubeVideoLoading: true,
                editingResponse: "",
                saving: false,
            }
        },
        watch: {},
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
            linkClasses(): string | undefined {
                if (!this.processedContent || !this.processedContent.link) {
                    return;
                }

                const linkStyle = this.processedContent.link.linkStyle || LinkStyle.link;
                let classes = "";
                switch (linkStyle) {
                    case LinkStyle.buttonPrimary:
                        classes = "button primary";
                        break;
                    case LinkStyle.buttonSecondary:
                        classes = "button secondary";
                        break;
                    case LinkStyle.fancyLink:
                        classes = "link fancy";
                        break;
                    case LinkStyle.link:
                        classes = "link";
                        break;

                }

                return classes;
            }
        },
        methods: {
            autosave: debounce(function (this: any) {
                this.save()
            }, 1000),
            save() {
                console.log("debounced save");
                this.$emit("save")
            },
            async doButtonAction() {
                if (!this.content.actionButton) {
                    return;
                }

                const action: ContentAction = this.content.actionButton.action;
                switch (action) {
                    case ContentAction.next:
                        await this.next();
                        break;
                    case ContentAction.previous:
                        this.previous();
                        break;
                    case ContentAction.complete:
                        this.complete();
                        break;
                }

            },
            async saveReflectionResponse() {
                this.saving = true;
                if (this.response) {
                    await ReflectionResponseService.sharedInstance.save(this.response);
                }
                this.saving = false;
            },
            async next() {
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
    @import "common";

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
    }

    .content, .lowerActions {
        z-index: 2;
    }

    .background-image {
        bottom: 0;
        left: 0;
        position: absolute;
        right: 0;

        @include r(600) {
            display: flex;
            justify-content: center;
            margin: 0 -2.4rem;
            order: 1;
            position: static;
        }

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
    }

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

    .photo-container {
        width: 100%;
        margin: 4rem 0;

        img {
            width: 100%;
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

    .grow-container {
        margin-top: 4.8rem;
    }

    .leaf3 {
        animation: growingLeaves 15s forwards;
        transform: scale(0.3) translate(20px, 25px);
        transform-origin: center;
    }

    .leaf7, .leaf5, .leaf1, .leaf2, .leaf4, .leaf6 {
        animation: growingLeaves2 15s forwards;
        opacity: 0;
        transform: scale(0.7) translate(19px, 18px);
    }

    .leaf7 {
        animation-delay: 6s;
    }

    .leaf5 {
        animation-delay: 16s;
    }

    .leaf1 {
        animation-delay: 21s;
    }

    .leaf4 {
        animation-delay: 30s;
    }

    .leaf2 {
        animation-delay: 32s;
    }

    .leaf6 {
        animation-delay: 44s;
    }

    .grow5 {
        animation: grow 60s forwards;
    }

    .lowerActions {
        bottom: 3.2rem;
        left: 2.4rem;
        position: absolute;
        right: 2.4rem;
    }

    .mobile-nav-buttons {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 1rem;

        @include r(600) {
            display: none;
        }

        .inline-arrow {
            flex-grow: 0;
        }

        .next {
            display: flex;
            height: 5.6rem;
            justify-content: center;
            padding: 0;
            width: 5.6rem;

            svg {
                height: 1.8rem;
                width: 1.8rem;
            }
        }
    }

    .reflect-container textarea {
        @include textArea;
        background-color: transparent;
        border-radius: 3rem;
        font-family: $font-stack;
        width: 100%;

        &:focus {
            background-color: $white;
            border-radius: 6px;
        }
    }

    .primaryBtn {
        width: 100%;

        @include r(600) {
            width: 50%;
        }
    }

    audio {
        border: 1px solid $lightGreen;
        box-shadow: rgba(7, 69, 76, 0.18) 0 11px 28px -8px;
        border-radius: 5.4rem;
        width: 100%;
    }
</style>
