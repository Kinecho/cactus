<template>
    <InsightsCard :reflection-response="response" v-if="isInsightsCard" @next="next" @previous="previous"/>
    <div v-else-if="processedContent" :class="['content-card', `type-${processedContent.contentType}`, processedContent.backgroundImage ? processedContent.backgroundImage.position : '', {reflectScreen: isReflectScreen}]">
        <section class="content">
            <div v-if="processedContent.text" class="text">
                <a v-if="processedContent.showElementIcon" class="element-container" @click.prevent="showCactusModal(cactusElement)">
                    <img :src="'/assets/images/elements/' + cactusElement + '.svg'" alt=""/>
                    <h4 class="label">{{cactusElement}}</h4>
                </a>
                <h4 v-if="processedContent.label" class="label">{{processedContent.label}}</h4>
                <h2 v-if="processedContent.title" class="title">{{processedContent.title}}</h2>
                <p :class="{tight: isShareNoteScreen}">
                    <MarkdownText :source="processedContent.text"/>
                </p>
            </div>

            <!--  START SHARE_NOTE -->
            <div v-if="isShareNoteScreen">
                <shared-reflection-card :response="response" :prompt-content="promptContent" :question="processedContent.text"/>

                <transition name="fade-in" mode="out-in">
                    <div v-if="shareableLinkUrl" class="share-note-link-container">
                        <transition name="snack" appear>
                            <snackbar-content :autoHide="true" v-if="linkCreated">
                                <svg slot="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 13">
                                    <path fill="#29A389" d="M1.707 6.293A1 1 0 0 0 .293 7.707l5 5a1 1 0 0 0 1.414 0l11-11A1 1 0 1 0 16.293.293L6 10.586 1.707 6.293z"/>
                                </svg>
                                <span slot="text">Shareable link created</span>
                            </snackbar-content>
                        </transition>
                        <p class="directLink">Here's your direct link to share:</p>
                        <copy-text-input v-if="shareableLinkUrl" :text="shareableLinkUrl" :queryParams="shareableLinkParams" :editable="false" buttonStyle="primary"/>
                        <div v-if="nativeShareEnabled" class="sharing">
                            <button class="btn secondary" @click="shareNatively()">
                                <img class="shareIcon" src="/assets/icons/share.svg" alt="Share Icon"/>Share
                            </button>
                        </div>
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
                <div class="quote">
                    <MarkdownText :source="processedContent.quote.text" :treatment="'quote'"/>
                </div>
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
                <a :href="linkDestinationUrl"
                        :target="processedContent.link.linkTarget"
                        :class="linkClasses">{{processedContent.link.linkLabel}}</a>
            </div>
            <!--      END Link      -->


            <!--     ADD CONTENT ACTION       -->
            <div class="link-container" v-if="showActionButton">
                <button :class="actionButtonClasses" @click="doButtonAction">{{processedContent.actionButton.label}}
                </button>
            </div>


            <!--    START Elements  -->
            <prompt-content-card-elements v-if="processedContent.elements"/>
            <!--    END Elements    -->

            <!--    START Invite Friend  -->
            <prompt-content-card-invite-friend
                    v-if="processedContent.invite"
                    @skip="next()"
                    @disableNavigation="disableNavigation()"/>
            <!--    END Invite Friend    -->

            <!--    START Grow -->
            <div class="grow-container" v-if="isReflectScreen">
                <svg class="element experience" v-if="cactusElement === 'experience'" xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56">
                    <g fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round">
                        <path class="path" vector-effect="non-scaling-stroke" stroke="#6590ED" stroke-width="2" d="M6,43.246933 C6.09556985,41.6492577 6.47490917,39.3864005 7.64407979,38.4663022 C9.92206117,36.67374 12.1315008,40.9299494 15.3626546,35.8457684 C16.1024929,34.6815037 16.3137877,33.1122828 17.2004578,32.0504606 C21.6146645,26.7642753 31.1258736,25.4281892 33.6484832,24.1881084 C35.0086316,23.5192755 35.4108752,20.9332717 36.4054169,19.7599992 C38.3777084,17.4322204 39.1756401,17.0345455 42.1024694,15.7837838"/>
                        <path class="path d1" vector-effect="non-scaling-stroke" stroke="#6590ED" stroke-width="2" d="M2.70228284e-13 10.6121443C1.75290468 7.58860245-.481866949 7.02566071.115226973 4.45115153.421190952 3.13129254 1.48780608 1.48786587 2.18931248.27778877M.277146314 4.86486486C4.14053199 5.14265363 7.04008155.499932452 8.04297101-6.66133815e-15" transform="translate(23.328 16.757)"/>
                        <g stroke="#6590ED" stroke-width="2" transform="translate(31.37 23.568)">
                            <path vector-effect="non-scaling-stroke" class="path d2" d="M-3.14415161e-13,1.39205149 C0.514027529,1.31471529 1.43547559,0.783588212 2.33626338,0.922921189 C4.11469946,1.19839143 5.86916963,2.27470673 7.80792941,1.84648152 C9.48389055,1.47641825 10.9383736,0.449316895 12.6829268,-4.6629367e-15"/>
                            <path vector-effect="non-scaling-stroke" class="path d3" d="M6.82926829,1.94594595 C6.84455233,1.9933146 8.34598441,2.39176854 8.57164875,2.56731118 C9.40597747,3.21305734 9.44104086,4.204316 10.4120269,4.83125402 C11.326372,5.42127236 12.634506,5.44077709 13.6585366,5.83783784"/>
                        </g>
                        <path vector-effect="non-scaling-stroke" class="path d0" stroke="#6590ED" stroke-width="2" d="M-4.44311254e-13,11.9534644 C1.83528374,9.91921096 0.570066663,7.62404743 0.289849563,4.94766847 C0.163475338,3.73973873 0.519830374,1.03473933 0.844707074,-1.24344979e-14" transform="translate(9.907 25.514)"/>
                        <path vector-effect="non-scaling-stroke" class="path d0" stroke="#6590ED" stroke-width="2" d="M1.80300219e-13,1.94594595 C0.553638722,2.0577171 4.87804878,-1.59872116e-14 7.80487805,-1.59872116e-14 C10.7317073,-1.59872116e-14 11.9978931,2.94678943 15.6097561,1.09424197" transform="translate(15.761 33.575)"/>
                        <path vector-effect="non-scaling-stroke" class="path d3" stroke="#6590ED" stroke-width="2" d="M0.183051526,8.75675676 C-0.156760026,8.44548027 -0.110043937,1.35936271 1.07705668,7.99360578e-15" transform="translate(39.074 8)"/>
                    </g>
                </svg>
                <svg v-else-if="cactusElement === 'meaning'" class="element meaning" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56">
                    <path class="path" fill="none" stroke="#FF7866" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" vector-effect="non-scaling-stroke" d="M26.7041607,32.4676435 C20.9673524,34.0703082 18.7120793,24.9157918 27.2,25.217529 C29.9215022,25.3142758 32,27.5871172 32.8,29.9567054 C34.5617997,35.17513 31.1483596,38.3854061 27.0807718,39.048493 C22.4421397,39.80467 15.2006909,38.0769746 15.2002758,29.4023705 C15.2,23.6378036 20.3704268,18.9389061 26.996641,18.89909 C36.5421921,18.8417319 40,25.217529 40.2565614,29.3216118 C40.4938509,33.117412 40.8,44.1742344 27.2,44.9640971 C14.4,45.4906723 8,40.2249208 8,29.1668427 C8,12.5797254 23.2,11 27.2,11 C31.2,11 48,11.7898627 48,29.1668427"/>
                </svg>
                <svg v-else-if="cactusElement === 'relationships'" class="element relationships" xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56">
                    <g fill="none" fill-rule="evenodd" stroke="#9490B0" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" transform="translate(10 8.178)">
                        <path vector-effect="non-scaling-stroke" class="path d1" d="M35.874371,34.351703 C34.713319,40.0878378 18.2480616,43.0005306 12.8375568,33.8422947 C6.64205763,23.3553171 10.6404816,1.5077001 24.356678,4.9626552 C31.3984645,6.73640177 25.3746425,14.5323352 26.7630404,19.2317315 C28.3915017,24.7436852 37.1453874,28.0779378 35.874371,34.351703 Z"/>
                        <path vector-effect="non-scaling-stroke" class="path" d="M0.290253649,4.41142771 C-1.25170394,8.51510034 3.82624276,11.7627979 4.36943236,15.4747757 C5.1742875,20.9816774 -0.234357991,29.2728826 7.0409907,32.4706823 C18.4009703,37.4638366 21.6346848,14.3404456 19.2761906,7.61823771 C18.0251022,4.05302893 14.846928,0.972130686 10.5820772,0.17883273 C6.3172264,-0.614465225 1.45723519,1.30916733 0.290253649,4.41142771 Z"/>
                    </g>
                </svg>
                <svg v-else-if="cactusElement === 'emotions'" class="element emotions" xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56">
                    <path class="path" fill="none" stroke="#33CCAB" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" vector-effect="non-scaling-stroke" d="M15.6036021,10.9932832 C12.3106486,18.8843727 28.9515983,31.4670116 29.9401092,38.5779763 C30.7874042,44.6647465 20.5845906,50.4519323 17.2254031,46.9286432 C16.4193481,46.0841319 16.1719079,45.0809004 16.1719079,43.8650437 C16.1719079,38.7141238 22.4363016,35.98456 25.5774144,36.5939737 C34.0292387,38.2337296 39.0836167,47.7998811 42.0444753,36.1440871 C46.2681088,19.5172201 16.9511569,39.9103339 11.4234067,28.5434715 C9.12384595,23.8148225 16.6137089,14.0349312 23.6844565,20.1182271 C32.0581931,27.3225455 34.7956313,0.854456739 43.9364441,15.8581438 C48.1262006,22.7351904 38.8360585,28.2292883 35.1298586,21.8961796 C28.3267513,10.2711139 18.5816318,3.8568634 15.6036021,10.9932832 Z" transform="rotate(90 28 28)"/>
                </svg>
                <svg v-else class="element energy" xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56">
                    <path class="path" fill="none" stroke="#FF99B2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" vector-effect="non-scaling-stroke" d="M6.07718848,33.0659031 C16.9034833,54.199668 20.7179299,20.251021 15.8579151,21.0429343 C10.9979002,21.8348476 13.8625604,37.5930451 19.6773127,37.9894412 C27.6775161,38.5348211 28.0221585,13.1185703 24.5423886,12.1275006 C19.4091615,10.6655114 24.3895721,41.7614486 30.3431156,42.9097293 C36.3335467,44.0651857 38.3505895,18.5270842 34.1893654,16.9067124 C29.4631525,15.0663352 32.4072958,35.8238194 37.147521,38.1746579 C44.9090376,42.0239099 46.864989,20.9520616 43.4838166,19.9890733 C38.3505895,18.5270842 43.573142,45.2571484 50.0771885,28.1235674" transform="rotate(9 28.077 27.513)"/>
                </svg>
            </div>
            <!--    END Grow -->

            <div :class="['backgroundImage', processedContent.backgroundImage.position]" v-if="processedContent.backgroundImage && processedContent.backgroundImage">
                <flamelink-image v-bind:image="processedContent.backgroundImage"/>
            </div>
        </section>

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
                    <resizable-textarea :max-height-px="200">
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
                        <svg class="pen wiggle" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                        {{promptCopy.ADD_A_NOTE}}
                    </span>
                </div>
            </div>
            <!--    END Reflect-->
        </section>
        <PricingModal
                :showModal="showPricingModal"
                @close="showPricingModal = false"/>
        <element-description-modal
                :cactusElement="cactusModalElement"
                :showModal="cactusModalVisible"
                :navigationEnabled="true"
                :showIntroCard="false"
                @close="hideCactusModal"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import PromptContent, {
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
    import { formatDurationAsTime } from '@shared/util/DateUtil'
    import { MINIMUM_REFLECT_DURATION_MS } from '@web/PromptContentUtil';
    import CopyService from '@shared/copy/CopyService'
    import { PromptCopy } from '@shared/copy/CopyTypes'
    import CopyTextInput from "@components/CopyTextInput.vue";
    import { QueryParam } from "@shared/util/queryParams"
    import SnackbarContent from "@components/SnackbarContent.vue"
    import ReflectionResponseService from '@web/services/ReflectionResponseService'
    import PromptContentCardElements from "@components/ElementsOverview.vue";
    import PromptContentCardInviteFriend from "@components/PromptContentCardInviteFriend.vue";
    import SharedReflectionCard from "@components/SharedReflectionCard.vue";
    import { CactusElement } from "@shared/models/CactusElement";
    import CactusMember from "@shared/models/CactusMember";
    import ElementDescriptionModal from "@components/ElementDescriptionModal.vue";
    import SharingService from '@web/services/SharingService'
    import Logger from "@shared/Logger";
    import { gtag } from "@web/analytics";
    import MarkdownText from "@components/MarkdownText.vue"
    import { appendQueryParams, isBlank } from "@shared/util/StringUtil";
    import PricingModal from "@components/PricingModal.vue";
    import { PageRoute } from "@shared/PageRoutes";
    import LegacyInsightsCard from "@components/LegacyInsightsCard.vue";

    const logger = new Logger("PromptContentCard.vue");
    const SAVED_INDICATOR_TIMEOUT_DURATION_MS = 2000;
    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
        components: {
            ResizableTextarea,
            Spinner,
            FlamelinkImage,
            CopyTextInput,
            SnackbarContent,
            SharedReflectionCard,
            PromptContentCardElements,
            PromptContentCardInviteFriend,
            ElementDescriptionModal,
            MarkdownText,
            PricingModal,
            InsightsCard: LegacyInsightsCard,
        },
        props: {
            content: {
                type: Object as () => Content
            },
            promptContent: {
                type: Object as () => PromptContent,
                required: true,
            },
            cactusElement: String,
            hasNext: Boolean,
            hasPrevious: Boolean,
            response: Object as () => ReflectionResponse,
            reflectionDuration: Number,
            saving: Boolean,
            saved: Boolean,
            tapAnywhereEnabled: Boolean,
            member: { type: Object as () => CactusMember | undefined, required: false, default: undefined },
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
            cactusModalVisible: boolean,
            cactusModalElement: string | undefined
            nativeShareEnabled: boolean,
            showPricingModal: boolean,
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
                cactusModalVisible: false,
                cactusModalElement: undefined,
                nativeShareEnabled: SharingService.canShareNatively(),
                showPricingModal: false,
            }
        },
        beforeMount() {
            this.shareableLinkUrl = ReflectionResponseService.getShareableUrl(this.response);
            // this.member = CactusMemberService.sharedInstance.currentMember;
        },
        watch: {
            saved(isSaved) {
                logger.log("saved changed", isSaved);
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
            isInsightsCard(): boolean {
                return this.response && this.processedContent?.contentType === ContentType.reflection_analysis;
            },
            shareableLinkParams(): {} | undefined {
                if (this.shareableLinkUrl && this.member?.email) {
                    return {
                        [QueryParam.REFERRED_BY_EMAIL]: this.member.email,
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
                return processContent({
                    content: this.content,
                    member: this.member,
                    promptContent: this.promptContent,
                    reflectionResponse: this.response
                });
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
            actionButtonClasses(): string {
                let classes = "";
                switch (this.processedContent?.actionButton?.linkStyle) {
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
                    default:
                        classes = "";
                        break;
                }
                return classes;
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
            },
            linkDestinationUrl(): string | undefined {
                let linkUrl = this.content?.link?.destinationHref;

                if (linkUrl && this.content?.link?.appendMemberId && this.member?.id) {
                    linkUrl = appendQueryParams(this.content.link.destinationHref, { memberId: this.member.id });
                }

                return linkUrl;
            },
            showActionButton(): boolean {
                const button = this.processedContent?.actionButton;
                if (!button) {
                    return false
                }
                return button.action !== ContentAction.unknown && !isBlank(button.label)
            }
        },
        methods: {
            async shareNatively() {
                await SharingService.shareLinkNatively({
                    url: this.shareableLinkUrl,
                    title: "Read my private reflection on Cactus",
                    text: "I'm practicing mindful self-reflection with Cactus and shared this private note with you"
                })
            },
            async createSharableLink() {
                this.trackShareLink();
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
                const action = this.content.actionButton.action ?? ContentAction.unknown;
                switch (action) {
                    case ContentAction.showPricing:
                        this.showPricingModal = true;
                        break;
                    case ContentAction.next:
                        await this.next();
                        break;
                    case ContentAction.previous:
                        this.previous();
                        break;
                    case ContentAction.complete:
                        this.complete();
                        break;
                    case ContentAction.coreValues:
                        window.open(`${ PageRoute.CORE_VALUES }`, "_blank");
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
            },
            showCactusModal(element: keyof typeof CactusElement) {
                this.cactusModalVisible = true;
                this.cactusModalElement = CactusElement[element];
                this.disableNavigation()
            },
            hideCactusModal() {
                this.cactusModalVisible = false;
                this.enableNavigation()
            },
            trackShareLink() {
                gtag('event', 'click', {
                    'event_category': "prompt_content",
                    'event_action': "shared_reflection"
                });
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
        background-color: $beige;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        min-height: 100vh;
        justify-content: center;
        padding: 2.4rem 2.4rem 3.2rem;
        width: 100%;

        @include r(600) {
            border-radius: 12px;
            box-shadow: 0 30px 160px -6px rgba(0, 0, 0, 0.3);
            min-height: 100%;
            justify-content: space-between;
            padding: 3.2rem 3.2rem 4rem;
            position: relative;
        }

        &.type-share_reflection {
            background: transparent;
            box-shadow: none;
            color: $white;
            min-height: 0;
            padding-top: 4rem;

            .tight {
                opacity: .8;
            }

            .text {
                padding: 0 0 2.4rem;
            }
        }

        &.reflectScreen {
            justify-content: space-between;
        }

        &.bottom {
            overflow: hidden;

            .content {
                justify-content: flex-end;
            }
        }
    }

    .content,
    .lowerActions {
        z-index: 2;
    }

    .backgroundImage {

        &:empty {
            display: none;
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
            align-items: flex-end;
            margin: 0 -2.4rem -4rem;
        }

        img {
            height: auto;
            max-height: 35rem;
            max-width: 100%;
        }
    }

    .element-container {
        cursor: pointer;
        text-align: center;
    }

    .text {
        display: flex;
        flex-direction: column;
        font-size: 2rem;
        justify-content: center;
        padding: 6.4rem 1.6rem 4rem;

        @include r(374) {
            font-size: 2.4rem;
        }
        @include r(600) {
            padding: 4rem 0;
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
        color: $darkestGreen;
        margin-bottom: 1.6rem;
    }

    .content {
        @include r(600) {
            display: flex;
            flex: 1;
            flex-direction: column;
            justify-content: center;
        }
    }

    .element-icon {
        $avatarSize: 5.6rem;
        display: block;
        height: $avatarSize;
        margin: 0 auto;
        width: $avatarSize;
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
            font-size: 1.6rem;
            font-weight: bold;
            opacity: .8;

            @include r(768) {
                font-size: 1.8rem;
            }
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

    .quote-container ~ .link-container {
        margin: 2.4rem 0 6.4rem;
    }

    .link-container {
        margin: -1.6rem 0 6.4rem;

        a {
            display: inline-block;
            margin: 0 auto;
            text-align: center;
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

        .element {
            height: 18rem;
            width: 18rem;
        }

        .path {
            stroke-dasharray: 700;
            stroke-dashoffset: 700;
            animation: dash 35s ease-out .5s forwards;
        }

        .experience .path {
            animation-duration: 60s;
            stroke-dasharray: 275;
            stroke-dashoffset: 275;

            &.d0 {
                animation-delay: 7s;
            }

            &.d2 {
                animation-delay: 16s;
            }

            &.d3 {
                animation-delay: 22s;
            }
        }

        .relationships .path {
            animation-duration: 60s;
        }

        .d1 {
            animation-delay: 12s;
        }
    }

    .lowerActions {
        bottom: 0;
        left: 2.4rem;
        position: sticky;
        right: 2.4rem;
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

        position: relative;
        transition: background-color .3s;
        width: 100%;
        z-index: 1;
        /*max-height: 10rem;*/

        &:focus {
            background-color: $white;
        }

        &.hasValue {
            border-width: 1px;
            background-color: $white;
        }

        &:hover + .textareaPlaceholder .wiggle {
            animation: wiggle .5s forwards;
        }
    }

    .reflect-container textarea + .textareaPlaceholder {
        @include button;
        margin: 0 auto;
        align-items: center;
        bottom: 0;
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
            height: 1.8rem;
            margin-right: .8rem;
            width: 1.8rem;
        }
    }

    .shareText {
        font-size: 1.6rem;
        opacity: .8;
    }

    .directLink {
        margin-bottom: 1.6rem;
        opacity: .8;
    }

    .sharing {
        display: flex;
        justify-content: center;

        button {
            align-items: center;
            display: flex;
            flex-grow: 0;
            justify-content: center;
            margin-top: 1.6rem;
            width: auto;

            @include r(600) {
                width: 50%;
            }
        }

        .shareIcon {
            height: 1.6rem;
            margin-right: .8rem;
            width: 1.6rem;
        }
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
<style lang="scss">
    @import "variables";

    .quote-container .md_wrapper strong {
        font-size: 2.8rem;
        line-height: 1.2;
    }
</style>
