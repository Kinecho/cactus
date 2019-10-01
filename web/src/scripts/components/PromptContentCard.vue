<template>
    <div v-if="processedContent" :class="['content-card', `type-${processedContent.contentType}`, {reflectScreen: isReflectScreen}]">
        <section class="content">
            <button class="skip tertiary" @click="next" v-show="showSkip">
                Skip
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                    <path fill="#07454C" d="M12.586 7L7.293 1.707A1 1 0 0 1 8.707.293l7 7a1 1 0 0 1 0 1.414l-7 7a1 1 0 1 1-1.414-1.414L12.586 9H1a1 1 0 1 1 0-2h11.586z"/>
                </svg>
            </button>

            <div v-if="processedContent.text" class="text">
                <h4 v-if="processedContent.label" class="label">{{processedContent.label}}</h4>
                <h2 v-if="processedContent.title" class="title">{{processedContent.title}}</h2>
                <p :class="{tight: isShareNoteScreen}">
                    <vue-simple-markdown :source="processedContent.text"></vue-simple-markdown>
                </p>
            </div>

            <!--  START SHARE_NOTE -->
            <div v-if="isShareNoteScreen">
                <shared-reflection-card :response="response"/>

                <transition name="fade-in" mode="out-in">
                    <div v-if="shareableLinkUrl" class="share-note-link-container">
                        <transition name="snack" appear>
                            <snackbar-content :autoHide="false" v-if="linkCreated">
                                <svg slot="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 13">
                                    <path fill="#29A389" d="M1.707 6.293A1 1 0 0 0 .293 7.707l5 5a1 1 0 0 0 1.414 0l11-11A1 1 0 1 0 16.293.293L6 10.586 1.707 6.293z"/>
                                </svg>
                                <span slot="text">Shareable link created</span>
                            </snackbar-content>
                        </transition>
                        <p class="directLink">Here's your direct link to share:</p>
                        <copy-text-input v-if="shareableLinkUrl" :text="shareableLinkUrl" :queryParams="shareableLinkParams" :editable="false" buttonStyle="secondary"/>
                    </div>
                    <button v-else class="button primary getLink"
                            :disabled="creatingLink"
                            :class="{loading: creatingLink}"
                            @click="createSharableLink">
                        {{creatingLink ? 'Creating' : 'Get Shareable Link'}}
                    </button>


                </transition>
            </div>
            <!--  END SHARE_NOTE -->

            <!--    START QUOTE    -->
            <div class="quote-container" v-if="processedContent.quote">
                <div class="avatar-container" v-if="quoteAvatar">
                    <flamelink-image v-bind:image="quoteAvatar" v-bind:width="60"/>
                </div>
                <p class="quote">
                    "{{processedContent.quote.text}}"
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
            <div class="photo-container" v-if="processedContent.photo">
                <flamelink-image v-bind:image="processedContent.photo"/>
            </div>
            <!--      END Photo      -->

            <!--    START AUDIO     -->
            <div class="audio-container" v-if="processedContent.audio">
                <audio controls :src="processedContent.audio.url"/>
            </div>
            <!--    END AUDIO     -->

            <!--      START Link      -->
            <div class="link-container" v-if="processedContent.link">
                <a :href="processedContent.link.destinationHref"
                        :target="processedContent.link.linkTarget"
                        :class="linkClasses">{{processedContent.link.linkLabel}}</a>
            </div>
            <!--      END Link      -->

            <!--    START Grow -->
            <div class="grow-container" v-if="isReflectScreen">
                <svg class="grow5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 156 150">
                    <path fill="#000" fill-opacity=".1" d="M124.962 140c0 5.524-20.812 10-46.48 10C52.812 150 32 145.524 32 140s20.812-10 46.482-10c25.668 0 46.48 4.476 46.48 10"/>
                    <path fill="#F5DD48" d="M36.558 93.048c-2.856 5.572-4.042 10.838-4.476 17.084-.436 6.246.852 12.71 4.268 17.958 4.256 6.544 11.472 10.716 18.99 12.83 7.426 2.088 15.22 2.378 22.934 2.606 7.712-.228 15.506-.518 22.932-2.606 7.518-2.114 14.734-6.286 18.992-12.83 3.416-5.248 4.704-11.712 4.268-17.958-.436-6.246-2.96-13.03-5.812-18.604C112.608 79.728 96.084 74 79.232 74c-17.934.002-36.24 6.488-42.674 19.048"/>
                    <path fill="#000" d="M94 82c22.54 26.762 25.36 52-18.43 58.49-7.318 1-10.2 1.502-8.646 1.51H82.61C136 140.49 124.548 98.874 110 82H94z" opacity=".05"/>
                    <ellipse cx="79" cy="83" fill="#000" opacity=".407" rx="31" ry="5"/>
                    <g class="leaf1">
                        <path fill="#2DB799" d="M119.242 21.576c-5.322 1.518-10.926 2.062-16.074 4.092-5.15 2.03-10.016 6.042-10.946 11.5l-1.496 3.426 8.694 20.05h8.648l13.312-3.274c5.656-5.51 7.758-13.712 8.536-21.57.782-7.858.506-15.88 2.498-23.52-2.47 4.952-7.848 7.778-13.172 9.296"/>
                        <path fill="#29A389" d="M130.466 19.014c-14.64 33.062-32.65 47.42-54.01 42.898a.5.5 0 0 1 .208-.98c20.796 4.408 38.416-9.64 52.888-42.32a.5.5 0 0 1 .914.404v-.002z"/>
                    </g>
                    <g class="leaf2">
                        <path fill="#2DB799" d="M23.744 35.8c.78 7.858 2.882 16.06 8.536 21.57l13.312 3.274h8.648l8.694-20.05-1.494-3.426c-.932-5.458-5.798-9.47-10.948-11.5-5.148-2.03-10.752-2.574-16.074-4.092-5.322-1.518-10.702-4.344-13.172-9.296 1.994 7.64 1.716 15.662 2.498 23.52"/>
                        <path fill="#29A389" d="M23.534 19.014c14.64 33.062 32.65 47.42 54.01 42.898a.5.5 0 0 0-.208-.98c-20.796 4.408-38.416-9.64-52.888-42.32a.5.5 0 0 0-.914.404v-.002z"/>
                    </g>
                    <g class="leaf3">
                        <path fill="#30C1A2" d="M42.688 42.818c-.822 13.026 16.01 28.2 16.01 28.2 13.092-9.848 12.556-32.89 12.556-32.89.912-5.376-.67-7.104-3.266-11.396-2.596-4.288-5.97-7.77-8.826-11.806C56.31 10.89 53.908 6.008 53.846.57c-5.19 13.65-10.222 27.446-11.158 42.248"/>
                        <path fill="#29A389" d="M53.3 4.264c-.072 36.16 10.54 56.6 31.894 61.156a.5.5 0 0 0 .208-.978c-20.79-4.434-31.174-24.436-31.1-60.174a.5.5 0 0 0-1-.004H53.3z"/>
                    </g>
                    <g class="leaf4">
                        <path fill="#30C1A2" d="M15.404 73.424c5.426 8.162 14.184 13.734 23.584 15.918 9.4 2.188 19.738.756 28.818-2.558L54.392 59.458c-4.984-2.79-10.808-2.546-16.592-2.304-1.792.074-3.576.15-5.334.134C20.612 57.188 0 44.44 0 44.44s9.544 20.164 15.404 28.984"/>
                        <path fill="#29A389" d="M1.628 46.774c24.14 26.92 45.706 35.01 64.62 24.108a.5.5 0 1 0-.498-.868c-18.418 10.616-39.518 2.7-63.378-23.908a.5.5 0 1 0-.744.668z"/>
                    </g>
                    <g class="leaf5">
                        <path fill="#30C1A2" d="M123.048 57.288c-1.758.016-3.544-.06-5.334-.134-5.784-.242-11.61-.486-16.59 2.304L87.708 86.784c9.08 3.314 19.42 4.746 28.818 2.558 9.4-2.184 18.16-7.756 23.586-15.918 5.858-8.82 15.404-28.984 15.404-28.984s-20.612 12.748-32.468 12.848"/>
                        <path fill="#29A389" d="M154.372 46.774c-24.14 26.92-45.706 35.01-64.62 24.108a.5.5 0 1 1 .498-.868c18.418 10.616 39.518 2.7 63.378-23.908a.5.5 0 1 1 .744.668z"/>
                    </g>
                    <g class="leaf6">
                        <path fill="#30C1A2" d="M95.068 14.354c-2.854 4.038-6.23 7.52-8.824 11.81-2.596 4.29-4.18 6.018-3.268 11.394 0 0-.536 23.044 12.556 32.89 0 0 16.834-15.172 16.01-28.2C110.606 27.446 105.576 13.65 100.38 0c-.06 5.438-2.46 10.32-5.314 14.354"/>
                        <path fill="#29A389" d="M101.212 5.596c.634 35.66-9.484 55.664-30.412 59.826a.5.5 0 0 1-.196-.98c20.346-4.048 30.234-23.596 29.608-58.83a.5.5 0 0 1 1-.016z"/>
                    </g>
                    <g class="leaf7">
                        <path fill="#33CCAB" d="M70.948 10.236c-.382 4.56-1.056 8.216-2.812 12.396-2.826 6.73-7.722 12.406-10.794 19.028-4.808 10.362-4.732 22.87.2 33.172 2.194 4.586 5.37 8.798 9.614 11.592 4.246 2.798 13.008 2.892 13.294 2.868 5.126-.422 11.384-4.284 14.236-8.686 2.918-4.502 5.634-9.288 6.58-14.57 1.952-10.868-3.894-21.612-10.768-30.256-6.872-8.644-19.17-32.386-19.17-32.386s-.368 6.706-.38 6.842"/>
                        <path fill="#29A389" d="M71.8 8.396c10.202 37.51 12.008 63.414 5.464 77.66a.5.5 0 1 0 .908.418c6.672-14.524 4.854-40.62-5.408-78.34a.5.5 0 1 0-.966.262h.002z"/>
                    </g>
                </svg>
            </div>
            <!--    END Grow -->
        </section>

        <div :class="['backgroundImage', processedContent.backgroundImage.position]" v-if="processedContent.backgroundImage && processedContent.backgroundImage">
            <flamelink-image v-bind:image="processedContent.backgroundImage"/>
        </div>

        <section class="lowerActions" v-if="tapAnywhereEnabled || (isReflectScreen && response)">

            <!--    START Reflect -->
            <div v-if="isReflectScreen && response" class="reflect-container">
                <div class="duration">
                    <h5>{{formattedDuration}}</h5>
                </div>
                <div class="share-warning" v-if="isReflectScreen && response && response.shared">
                    <img src="/assets/images/users.svg"/>
                    <span class="shareText">This note is shared</span>
                </div>
                <transition name="fade-in" mode="out-in">
                    <div class="saved-container" v-show="showSaved || saving">
                        <span v-show="saving && !saved">{{promptCopy.SAVING}}...</span>
                        <span v-show="saved && !saving">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 13"><path d="M1.707 6.293A1 1 0 0 0 .293 7.707l5 5a1 1 0 0 0 1.414 0l11-11A1 1 0 1 0 16.293.293L6 10.586 1.707 6.293z"/></svg>
                            {{promptCopy.SAVED}}
                        </span>
                    </div>
                </transition>
                <div class="flexContainer">
                    <resizable-textarea v-bind:maxLines="4">
                    <textarea ref="reflectionInput"
                            type="text"
                            rows="1"
                            data-gramm="false"
                            v-model="response.content.text"
                            v-on:click.stop
                            :class="{hasValue: !!response.content.text}"
                            @focusin="disableNavigation"
                            @focusout="enableNavigation"
                    />
                    </resizable-textarea>
                    <span class="textareaPlaceholder">
                        <svg class="pen wiggle" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22"><path fill="#29A389" d="M18.99.302a3.828 3.828 0 0 1 1.717 6.405l-13.5 13.5a1 1 0 0 1-.444.258l-5.5 1.5a1 1 0 0 1-1.228-1.228l1.5-5.5a1 1 0 0 1 .258-.444l13.5-13.5A3.828 3.828 0 0 1 18.99.302zM5.98 18.605L19.294 5.293a1.828 1.828 0 1 0-2.586-2.586L3.395 16.02l-.97 3.556 3.556-.97z"/></svg>
                        {{promptCopy.ADD_A_NOTE}}
                    </span>
                </div>
            </div>
            <!--    END Reflect-->
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
    import {formatDurationAsTime} from '@shared/util/DateUtil'
    import {MINIMUM_REFLECT_DURATION_MS} from '@web/PromptContentUtil';
    import CopyService from '@shared/copy/CopyService'
    import {PromptCopy} from '@shared/copy/CopyTypes'
    import VueSimpleMarkdown from 'vue-simple-markdown'
    import CopyTextInput from "@components/CopyTextInput.vue";
    import {QueryParam} from "@shared/util/queryParams"
    import SnackbarContent from "@components/SnackbarContent.vue"
    import ReflectionResponseService from '@web/services/ReflectionResponseService'
    import SharedReflectionCard from "@components/SharedReflectionCard.vue";
    import CactusMemberService from '@web/services/CactusMemberService'

    const SAVED_INDICATOR_TIMEOUT_DURATION_MS = 2000;
    const copy = CopyService.getSharedInstance().copy;

    Vue.use(VueSimpleMarkdown);

    export default Vue.extend({
        components: {
            ResizableTextarea,
            Spinner,
            FlamelinkImage,
            CopyTextInput,
            SnackbarContent,
            SharedReflectionCard,
        },
        props: {
            content: {
                type: Object as () => Content
            },
            hasNext: Boolean,
            hasPrevious: Boolean,
            response: Object as () => ReflectionResponse,
            reflectionDuration: Number,
            saving: Boolean,
            saved: Boolean,
            tapAnywhereEnabled: Boolean,
        },
        data(): {
            youtubeVideoLoading: boolean,
            editingResponse: string,
            showSaved: boolean,
            showSavingTimeout: any,
            promptCopy: PromptCopy,
            creatingLink: boolean,
            shareableLinkUrl: string | undefined,
            linkCreated: boolean,
        } {
            return {
                youtubeVideoLoading: true,
                editingResponse: "",
                showSaved: false,
                showSavingTimeout: undefined,
                promptCopy: copy.prompts,
                creatingLink: false,
                shareableLinkUrl: undefined,
                linkCreated: false,
            }
        },
        beforeMount() {
            this.shareableLinkUrl = ReflectionResponseService.getShareableUrl(this.response);
        },
        watch: {
            saved(isSaved) {
                console.log("saved changed", isSaved);
                if (this.showSavingTimeout) {
                    window.clearTimeout(this.showSavingTimeout);
                    this.showSavingTimeout = undefined;
                }
                if (isSaved) {
                    this.showSaved = true;
                }
                this.showSavingTimeout = setTimeout(() => {
                    this.showSaved = false;
                }, SAVED_INDICATOR_TIMEOUT_DURATION_MS);
            }
        },
        computed: {
            shareableLinkParams(): {} | undefined {
                if (this.shareableLinkUrl) {
                    const member = CactusMemberService.sharedInstance.getCurrentCactusMember();
                    const email = member && member.email;
                    return {
                        [QueryParam.REFERRED_BY_EMAIL]: email,
                        [QueryParam.UTM_MEDIUM]: "prompt-share-note",
                        [QueryParam.UTM_SOURCE]: "cactus.app",
                    }
                }
                return;

            },
            showSkip(): boolean {
                return this.processedContent && this.processedContent.contentType === ContentType.share_reflection;
            },
            reflectionProgress(): number {
                return Math.min(this.reflectionDuration / MINIMUM_REFLECT_DURATION_MS, 1);
            },
            formattedDuration(): string {
                return formatDurationAsTime(this.reflectionDuration);
            },
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
            isShareNoteScreen(): boolean {
                return this.content.contentType === ContentType.share_reflection;
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
            async createSharableLink() {
                this.creatingLink = true;
                let saved = await ReflectionResponseService.sharedInstance.shareResponse(this.response);
                this.shareableLinkUrl = ReflectionResponseService.getShareableUrl(saved);
                this.linkCreated = true;
                this.creatingLink = false;
            },
            async unshareReflection() {
                this.creatingLink = true;
                await ReflectionResponseService.sharedInstance.unShareResponse(this.response);
                this.shareableLinkUrl = undefined;
                this.creatingLink = false
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
            async next() {
                if (this.isReflectScreen && this.reflectionProgress < 1) {
                    return;
                }

                this.$emit("next")
            },
            previous() {
                this.$emit("previous");
            },
            complete() {
                this.$emit("complete")
            },
            enableNavigation() {
                this.$emit("navigationEnabled")
            },
            disableNavigation() {
                this.$emit("navigationDisabled")
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "variables";
    @import "mixins";
    @import "forms";
    @import "common";
    @import "transitions";

    .content-card {
        background: $lightBlue no-repeat;
        display: flex;
        flex-direction: column;
        height: 100%;
        justify-content: space-between;
        padding: 2.4rem;
        width: 100%;

        @include r(600) {
            border-radius: 12px;
            box-shadow: rgba(7, 69, 76, 0.18) 0 11px 28px -8px;
            overflow: hidden;
            position: relative;
        }

        .slide-1 & {
            background-image: url(/assets/images/greenNeedleBlob.svg),
            url(/assets/images/pinkBlob.svg);
            background-position: right -210px bottom 38vh,
            right -140px bottom 28vh;
            background-size: 250px, 180px;
        }

        .slide-2 &, .slide-3 & {
            background-image: url(/assets/images/greenNeedleBlob.svg),
            url(/assets/images/pinkBlob.svg),
            url(/assets/images/yellowNeedleBlob.svg),
            url(/assets/images/yellowBlob.svg);
            background-position: left -210px bottom 38vh,
            left -150px bottom 28vh,
            right -440px bottom 48vh,
            right -205px bottom 67vh;
            background-size: 250px, 180px, 470px, 240px;
        }

        .slide-4 & {
            background-image: url(/assets/images/yellowNeedleBlob.svg),
            url(/assets/images/yellowBlob.svg),
            url(/assets/images/yellowNeedleBlob.svg),
            url(/assets/images/pinkBlob.svg);
            background-position: left -375px bottom 48vh,
            left -215px bottom 68vh,
            right -415px bottom -22vh,
            right -155px bottom 4vh;
            background-size: 470px, 240px, 470px, 180px;
        }

        .slide-5 &, .slide-6 & {
            background-image: url(/assets/images/yellowNeedleBlob.svg),
            url(/assets/images/pinkBlob.svg),
            url(/assets/images/maroonTriangleBlob.svg),
            url(/assets/images/lightGreenBlob.svg);
            background-position: left -280px bottom -22vh,
            left -165px bottom 4vh,
            right -335px bottom 32vh,
            right -250px bottom 44vh;
            background-size: 470px, 180px, 390px, 270px;
        }

        .slide-7 &, .slide-8 & {
            background-image: url(/assets/images/maroonTriangleBlob.svg),
            url(/assets/images/lightGreenBlob.svg);
            background-position: left -335px bottom 32vh,
            left -250px bottom 44vh;
            background-size: 390px, 270px;
        }

        @include r(600) {
            .slide-1 &,
            .slide-2 &,
            .slide-3 &,
            .slide-4 &,
            .slide-5 &,
            .slide-6 &,
            .slide-7 &,
            .slide-8 & {
                background-image: none;
            }
        }

        &.type-share_reflection {
            // background: $lightBlue url(assets/images/lightGreenNeedles.svg) 0 0/250px;
            background: transparent;
            box-shadow: none;

            .text {
                padding: 0 0 2.4rem;
            }
        }
    }

    .content, .lowerActions {
        z-index: 2;
    }

    .backgroundImage {
        bottom: 0;
        left: 0;
        margin: 0 -2.4rem -2.4rem;
        max-height: 40vh;
        position: relative;
        right: 0;
        overflow: hidden;

        .slide-0 &:empty {
            $backgrounds: url(assets/images/maroonTriangleBlob.svg) left -56px bottom -28px/260px,
            url(assets/images/yellowNeedleBlob.svg) right -216px bottom -180px/480px,
            url(assets/images/pinkBlob.svg) left -56px bottom -11px/180px,
            url(assets/images/lightGreenBlob.svg) right -56px bottom -11px/180px,
            url(assets/images/yellowBlob.svg) left -56px bottom -11px/180px;

            $bgKey: random(length($backgrounds));
            $nth: nth($backgrounds, $bgKey);

            background: #{$nth} no-repeat;
            height: 200px;
            margin: 0;
            position: absolute;
            width: 100%;
        }

        @include r(600) {
            display: flex;
            justify-content: center;
            max-height: none;
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

            @include r(600) {
                max-height: 30rem;
            }
        }
    }

    .text {
        font-size: 2rem;
        padding: 4rem 1.6rem;

        .reflectScreen & {
            margin-top: -5.6rem;
        }

        @include r(374) {
            font-size: 2.4rem;
        }

        p {
            white-space: pre-line;

            &.tight {
                font-size: 1.8rem;
            }
        }
    }

    .skip.tertiary {
        align-items: center;
        color: $darkestGreen;
        display: none;
        flex-grow: 0;
        justify-content: center;
        position: absolute;
        right: 0;
        top: 1.6rem;
        width: min-content;

        svg {
            height: 1.2rem;
            margin-left: .4rem;
            width: 1.2rem;
        }

        @include r(600) {
            display: none;
        }
    }

    .note {
        @include shadowbox;
        margin-bottom: 2.4rem;
        padding: 1.6rem 2.4rem;
        text-align: left;
    }

    .noteQuestion,
    .copyText {
        margin-bottom: .8rem;
    }

    .getLink {
        width: 100%;
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
            font-size: 2rem;
            margin-bottom: 2.4rem;
            padding: 0 1.6rem;

            @include r(374) {
                font-size: 2.4rem;
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
        margin-top: 4rem;

        img {
            border-radius: 4px;
            display: block;
            max-width: 100%;
            margin: 0 auto; /* center smaller image in card */
        }
    }

    .video-container {
        border-radius: 4px;
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

    .link-container {
        margin: 4rem 0;

        a {
            display: inline-block;
            margin: 0 auto;
        }
    }

    .audio-container {
        margin-top: 4rem;

        audio {
            border: 1px solid $lightGreen;
            box-shadow: rgba(7, 69, 76, 0.18) 0 11px 28px -8px;
            border-radius: 5.4rem;
            width: 100%;
        }
    }

    .grow-container {
        align-items: center;
        display: flex;
        height: 156px;
        justify-content: center;
        margin: -2.4rem 0 2.4rem;
    }

    .leaf7 {
        animation: growingLeaves 8s forwards;
        transform: scale(0.3) translate(5px, 30px);
        transform-origin: center;
    }

    .leaf3, .leaf5, .leaf1, .leaf2, .leaf4, .leaf6 {
        animation: growingLeaves2 15s forwards;
        opacity: 0;
        transform: scale(0.5) translate(5px, 3px);
        transform-origin: center;
    }

    .leaf3 {
        animation-delay: 3s;
        animation-duration: 8s;
    }

    .leaf5 {
        animation-delay: 6s;
    }

    .leaf1 {
        animation-delay: 11s;
    }

    .leaf4 {
        animation-delay: 17s;
    }

    .leaf2 {
        animation-delay: 21s;
    }

    .leaf6 {
        animation-delay: 28s;
    }

    .grow5 {
        animation: grow 60s forwards;
        height: 75px;
        width: 78px;
    }

    .lowerActions {
        bottom: 3.2rem;
        left: 2.4rem;
        position: sticky;
        right: 2.4rem;

        @include r(600) {
            position: absolute;
        }
    }

    .tap {
        font-size: 1.4rem;
        font-weight: bold;
        letter-spacing: 1px;
        opacity: .4;
        text-align: center;
        text-transform: uppercase;
    }

    .mobile-nav-buttons {
        background-color: $lightBlue;
        margin: 0 -2.4rem -3.2rem;
        padding: .8rem;

        @include r(600) {
            display: none;
        }
    }

    .saved-container {
        font-size: 1.6rem;
        margin-bottom: .8rem;
        opacity: .8;
        text-align: left;

        svg {
            fill: $darkGreen;
            height: 1.2rem;
            margin-right: .4rem;
            width: 1.6rem;
        }
    }

    .flexContainer {
        position: relative;
    }

    .reflect-container textarea {
        @include textArea;
        background-color: transparent;
        border-width: 0;
        border-radius: 2.4rem;
        cursor: pointer;
        max-height: 10rem;
        position: relative;
        transition: background-color .3s;
        width: 100%;
        z-index: 1;

        &:focus {
            background-color: $white;
        }

        &.hasValue {
            border-width: 1px;
        }

        &:hover + .textareaPlaceholder .wiggle {
            animation: wiggle .5s forwards;
        }
    }

    .reflect-container textarea + .textareaPlaceholder {
        align-items: center;
        bottom: 0;
        color: $darkGreen;
        display: flex;
        justify-content: center;
        left: 0;
        position: absolute;
        right: 0;
        top: 0;
        transition: opacity .3s;
        z-index: 0;

        .pen {
            height: 1.8rem;
            margin-right: .8rem;
            width: 1.8rem;
        }
    }

    .reflect-container textarea:focus + .textareaPlaceholder,
    .reflect-container textarea.hasValue + .textareaPlaceholder {
        opacity: 0;
    }

    .primaryBtn {
        width: 100%;

        @include r(600) {
            width: 50%;
        }
    }

    .duration {
        display: none;
    }

    .share-warning {
        align-items: center;
        display: flex;
        justify-content: center;
        padding: .8rem 1.6rem;

        img {
            height: 2rem;
            margin-right: .8rem;
            width: 2rem;
        }
    }

    .shareText {
        opacity: .7;
    }

    .directLink {
        margin-bottom: 1.6rem;
    }


    .snack {
        &-enter-active {
            transition: all .2s cubic-bezier(.42, .97, .52, 1.49)
        }

        &-leave-active {
            transition: all .2s ease;
        }

        &-enter {
            opacity: 0;
            transform: translateY(15px);
        }

        &-leave-to {
            opacity: 0;
            transform: translateX(-150px);
        }
    }

</style>
