<template>
    <div :class="['flip-container', 'celebrate-container', {flipped: flipped}]">
        <div class="flipper">
            <div :class="['front', 'flip-card']">
                <upgrade-banner :member="member"/>
                <div class="successText">
                    <h2>{{celebrateText}}</h2>
                    <p class="subtext" v-if="subscriptionTier == plusTier">Here are words that have come up recently for you. The bubbles update the more you write.</p>
                </div>
                <div class="insightContainer revealed">
                    <MemberInsights
                            :words="wordData"
                            :didWrite="didWriteReflection"
                            :subscriptionTier="isOnboardingPrompt ? plusTier : subscriptionTier"
                            :startGated="subscriptionTier === basicTier"
                            :startBlurred="subscriptionTier === basicTier"
                            :loggedIn="loggedIn"/>
                </div>
                <div class="stats-container">
                    <section class="metric">
                        <svg-icon icon="journal"/>
                        <div class="label">
                            <transition name="fade-in" mode="out-in" appear>
                                <span v-if="reflectionCount !== undefined">{{reflectionCount}}</span>
                                <spinner v-if="reflectionCount === undefined" :delay="1000"/>
                            </transition>
                        </div>
                        <p v-show="reflectionCount !== undefined">
                            {{promptCopy.REFLECTIONS}}
                        </p>
                    </section>
                    <section class="metric">
                        <svg-icon icon="clock"/>
                        <div class="label">
                            <transition name="fade-in" mode="out-in" appear>
                                <span v-if="totalDuration !== undefined">{{totalDuration}}</span>
                                <spinner v-if="totalDuration === undefined" :delay="1000"/>
                            </transition>
                        </div>
                        <p v-show="totalDuration !== undefined">
                            {{durationLabel}}
                        </p>
                    </section>
                    <section class="metric" v-if="currentStreak == 'days'">
                        <svg-icon icon="flame"/>
                        <div class="label">
                            <transition name="fade-in" mode="out-in" appear>
                                <span v-if="streakDays !== undefined">{{streakDays}}</span>
                                <spinner v-if="streakDays === undefined" :delay="1000"/>
                            </transition>
                        </div>
                        <p v-show="streakDays !== undefined">
                            {{promptCopy.DAY_STREAK}}
                        </p>
                    </section>
                    <section class="metric" v-if="currentStreak == 'weeks'">
                        <svg-icon icon="flame"/>
                        <div class="label">
                            <transition name="fade-in" mode="out-in" appear>
                                <span v-if="streakWeeks !== undefined">{{streakWeeks}}</span>
                                <spinner v-if="streakWeeks === undefined" :delay="1000"/>
                            </transition>
                        </div>
                        <p v-show="streakWeeks !== undefined">
                            {{promptCopy.WEEK_STREAK}}
                        </p>
                    </section>
                    <section class="metric" v-if="currentStreak == 'months'">
                        <svg-icon icon="flame"/>
                        <div class="label">
                            <transition name="fade-in" mode="out-in" appear>
                                <span v-if="streakMonths !== undefined">{{streakMonths}}</span>
                                <spinner v-if="streakMonths === undefined" :delay="1000"/>
                            </transition>
                        </div>
                        <p v-show="streakMonths !== undefined">
                            {{promptCopy.MONTH_STREAK}}
                        </p>
                    </section>
                </div>
                <div class="btnContainer">
                    <button class="lowerBtn authBtn"
                            v-if="authLoaded && loggedIn && !isModal"
                            @click="close">
                        {{promptCopy.GO_HOME}}
                    </button>
                    <button class="lowerBtn authBtn secondary" v-if="didWriteReflection && !isOnboardingPrompt" @click="tradeNote">
                        Share Note
                    </button>
                </div>
            </div>
            <div :class="[ 'flip-card', 'back']">
                <legacy-prompt-content-card
                        v-if="showTradeNote"
                        :content="sharingContentCard"
                        :response="reflectionResponse"
                        :promptContent="promptContent" />
                <div class="flexContainer">
                    <button @click="flipped = false" class="backBtn tertiary">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                            <path d="M12.586 7L7.293 1.707A1 1 0 0 1 8.707.293l7 7a1 1 0 0 1 0 1.414l-7 7a1 1 0 1 1-1.414-1.414L12.586 9H1a1 1 0 1 1 0-2h11.586z"/>
                        </svg>
                        Back
                    </button>
                    <button class="secondary" @click="close">{{promptCopy.GO_HOME}}</button>
                </div>
            </div>
        </div>
        <element-description-modal
                :cactusElement="cactusModalElement"
                :showModal="cactusModalVisible"
                :navigationEnabled="true"
                :showIntroCard="false"
                @close="hideCactusModal"/>
        <input-name-modal
                :showModal="inputNameModalVisible"
                @close="transitionToTradeNote"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Spinner from "@components/Spinner.vue";
    import { Config } from "@web/config";
    import ReflectionResponseService from '@web/services/ReflectionResponseService'
    import { millisecondsToMinutes } from '@shared/util/DateUtil'
    import { ElementAccumulation } from '@shared/models/ElementAccumulation'
    import ReflectionResponse from '@shared/models/ReflectionResponse'
    import CactusMemberService from '@web/services/CactusMemberService'
    import { ListenerUnsubscriber } from '@web/services/FirestoreService'
    import CactusMember from '@shared/models/CactusMember'
    import { PageRoute } from '@shared/PageRoutes'
    import MagicLink from "@components/MagicLinkInput.vue";
    import StorageService, { LocalStorageKey } from '@web/services/StorageService'
    import CopyService from '@shared/copy/CopyService'
    import { ElementCopy, PromptCopy } from '@shared/copy/CopyTypes'
    import PromptContent, { Content, ContentType } from '@shared/models/PromptContent'
    import { isBlank } from "@shared/util/StringUtil"
    import LegacyPromptContentCard from '@components/LegacyPromptContentCard.vue'
    import Modal from "@components/Modal.vue";
    import { CactusElement } from "@shared/models/CactusElement";
    import ElementDescriptionModal from "@components/ElementDescriptionModal.vue";
    import ReflectionCelebrateUpgradeBanner from "@components/ReflectionCelebrateUpgradeBanner.vue";
    import InputNameModal from "@components/InputNameModal.vue";
    // import InsightWordChart from "@components/InsightWordChart.vue";
    import MemberInsights from "@components/MemberWordCloudInsights.vue";
    import { getElementAccumulationCounts } from "@shared/util/ReflectionResponseUtil"
    import { SubscriptionTier } from "@shared/models/SubscriptionProductGroup";
    import Logger from "@shared/Logger";
    import { gtag } from "@web/analytics"
    import { pushRoute } from "@web/NavigationUtil";
    import SvgIcon from "@components/SvgIcon.vue";
    import { InsightWord } from "@shared/api/InsightLanguageTypes";

    const logger = new Logger("ReflectionCelebrateCard.vue");
    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
        components: {
            Modal,
            Spinner,
            MagicLink,
            LegacyPromptContentCard,
            ElementDescriptionModal,
            InputNameModal,
            UpgradeBanner: ReflectionCelebrateUpgradeBanner,
            MemberInsights,
            SvgIcon
        },
        async beforeMount() {
            CactusMemberService.sharedInstance.observeCurrentMember({
                onData: async ({ member }) => {
                    this.member = member;
                    this.authLoaded = true;
                    this.loggedIn = !!member;

                    if (StorageService.getBoolean(LocalStorageKey.memberStatsEnabled) && member && member.stats.reflections) {
                        logger.log("using member stats");
                        this.setDurationMs(member.stats.reflections.totalDurationMs);
                        this.reflectionCount = member.stats.reflections.totalCount;
                        this.streakDays = member.stats.reflections.currentStreakDays;
                        this.streakWeeks = member.stats.reflections.currentStreakWeeks;
                        this.streakMonths = member.stats.reflections.currentStreakMonths;
                        this.elementAccumulations = member.stats.reflections.elementAccumulation;
                        this.selectStreak();
                    } else {
                        //this will calculate stats if the member doesn't have the new stats object
                        //Or, if the user is anonymous/not logged in.
                        logger.log("calculating streak from raw data");
                        await this.calculateStats()
                    }

                    this.loading = false;
                }
            });
        },
        props: {
            reflectionResponse: {
                type: Object as () => ReflectionResponse
            },
            promptContent: { type: Object as () => PromptContent },
            isModal: Boolean,
            cactusElement: String as () => CactusElement,
        },
        data(): {
            reflectionCount: number | undefined,
            totalDuration: string | undefined,
            streakDays: number | undefined,
            streakWeeks: number | undefined,
            streakMonths: number | undefined,
            elementAccumulations: ElementAccumulation | undefined,
            loading: boolean,
            authLoaded: boolean,
            loggedIn: boolean,
            authUnsubscriber: ListenerUnsubscriber | undefined,
            member: CactusMember | undefined,
            flipped: boolean,
            durationLabel: string,
            promptCopy: PromptCopy,
            elementCopy: ElementCopy,
            showTradeNote: boolean,
            cactusModalVisible: boolean,
            cactusModalElement: string | undefined,
            inputNameModalVisible: boolean,
            sawInputNameModal: boolean,
            currentStreak: 'days' | 'weeks' | 'months'
        } {
            return {
                reflectionCount: undefined,
                totalDuration: undefined,
                streakDays: undefined,
                streakWeeks: undefined,
                streakMonths: undefined,
                elementAccumulations: undefined,
                loading: true,
                loggedIn: false,
                authLoaded: false,
                authUnsubscriber: undefined,
                member: undefined,
                flipped: false,
                durationLabel: "",
                promptCopy: copy.prompts,
                elementCopy: copy.elements,
                showTradeNote: false,
                cactusModalVisible: false,
                cactusModalElement: undefined,
                inputNameModalVisible: false,
                sawInputNameModal: false,
                currentStreak: 'days'
            }
        },
        destroyed() {
            if (this.authUnsubscriber) {
                this.authUnsubscriber();
            }
        },
        computed: {
            isOnboardingPrompt(): boolean {
                return this.promptContent.documentId === Config.firstPromptId;
            },
            plusTier(): SubscriptionTier {
                return SubscriptionTier.PLUS;
            },
            basicTier(): SubscriptionTier {
                return SubscriptionTier.BASIC;
            },
            subscriptionTier(): SubscriptionTier | undefined {
                return this.member?.tier;
            },
            loginUrl(): string {
                const base = `${ PageRoute.SIGNUP }`;
                // const params = {}
                return base;
            },
            celebrateText(): string {
                const celebrations = copy.prompts.CELEBRATIONS || ["Nice Work!"];
                return celebrations[Math.floor(Math.random() * celebrations.length - 1)] || celebrations[0]
            },
            sharingContentCard(): Content | undefined {
                let shareReflectionCopy = isBlank(this.promptContent.shareReflectionCopy_md) ? copy.prompts.SHARE_PROMPT_COPY_MD : this.promptContent.shareReflectionCopy_md;
                const sharingCard: Content = {
                    contentType: ContentType.share_reflection,
                    text_md: shareReflectionCopy,
                    title: copy.prompts.SHARE_YOUR_NOTE,
                };

                return sharingCard
            },
            elementName(): string | undefined {
                switch (this.cactusElement) {
                    case CactusElement.emotions:
                        return this.elementCopy.EMOTIONS;
                    case CactusElement.experience:
                        return this.elementCopy.EXPERIENCE;
                    case CactusElement.relationships:
                        return this.elementCopy.RELATIONSHIPS;
                    case CactusElement.meaning:
                        return this.elementCopy.MEANING;
                    case CactusElement.energy:
                        return this.elementCopy.ENERGY;
                    default:
                        return this.cactusElement
                }
            },
            hasTone(): boolean {
                return this.member?.wordCloud ? true : false;
            },
            wordData(): InsightWord[] | undefined {
                return this.member?.wordCloud;
            },
            didWriteReflection(): boolean {
                return this.reflectionResponse?.content?.text ? true : false;
            }
        },
        methods: {
            async calculateStats() {
                const member = this.member;
                const reflections = await ReflectionResponseService.sharedInstance.getAllReflections();
                logger.log("all reflections", reflections);
                if (reflections.length === 0 && this.reflectionResponse) {
                    reflections.push(this.reflectionResponse);
                }

                const totalDuration = reflections.reduce((duration, doc) => {
                    const current = doc.reflectionDurationMs || 0;
                    logger.log("current response duration ", current);
                    return duration + (Number(current) || 0);
                }, 0);


                logger.log("totalDuration", totalDuration);
                this.setDurationMs(totalDuration);
                this.elementAccumulations = getElementAccumulationCounts(reflections);
                this.reflectionCount = reflections.length;
                const { dayStreak, weekStreak, monthStreak } = ReflectionResponseService.getCurrentStreaks(reflections, member);
                this.streakDays = dayStreak;
                this.streakWeeks = weekStreak;
                this.streakMonths = monthStreak;
                this.selectStreak();
            },
            setDurationMs(totalDuration: number) {
                if (totalDuration < (60 * 1000)) {
                    this.totalDuration = `${ Math.round(totalDuration / 1000) }`;
                    this.durationLabel = copy.prompts.SECONDS
                } else {
                    this.durationLabel = copy.prompts.MINUTES;
                    this.totalDuration = millisecondsToMinutes(totalDuration, 0);
                }
            },
            back() {
                this.$emit("back");
            },
            close() {
                this.$emit("close");
            },
            restart() {
                this.$emit("restart");
            },
            enableNavigation() {
                this.$emit("navigationEnabled")
            },
            disableNavigation() {
                this.$emit("navigationDisabled")
            },
            magicLinkSuccess(email: string | undefined) {
                logger.log("Celebrate Screen: Magic link sent successfully to ", email);
                if (this.reflectionResponse && this.reflectionResponse.promptId) {
                    StorageService.removeItem(LocalStorageKey.anonReflectionResponse, this.reflectionResponse.promptId);
                }
            },
            magicLinkError(message: string | undefined) {
                logger.error("Celebrate component: Failed to send magic link", message);
            },
            async showLogin() {
                await pushRoute(PageRoute.SIGNUP + "?message=" + encodeURIComponent("Sign up to save your progress and keep your practice going."));
            },
            showCactusModal(element: keyof typeof CactusElement) {
                this.cactusModalVisible = true;
                this.cactusModalElement = CactusElement[element];
                this.disableNavigation()
            },
            tradeNote() {
                this.trackShareTap();
                if (this.member && !this.member.getFullName() && !this.sawInputNameModal) {
                    this.showInputNameModal();
                } else {
                    this.showTradeNote = true;
                    this.flipped = true;
                }
            },
            hideCactusModal() {
                this.cactusModalVisible = false;
                this.enableNavigation()
            },
            showInputNameModal() {
                this.inputNameModalVisible = true;
                this.sawInputNameModal = true;
            },
            hideInputNameModal() {
                this.inputNameModalVisible = false;
            },
            async updateResponseMemberName() {
                if (this.reflectionResponse && this.member) {
                    await ReflectionResponseService.sharedInstance.updateResponseMemberName(this.reflectionResponse, this.member);
                }
            },
            transitionToTradeNote() {
                this.updateResponseMemberName();
                this.hideInputNameModal();
                this.tradeNote();
            },
            trackShareTap() {
                gtag('event', 'click', {
                    'event_category': "prompt_content",
                    'event_action': "clicked_share_note"
                });
            },
            selectStreak() {
                this.currentStreak = 'days';

                if (this.streakDays && this.streakWeeks && this.streakMonths) {
                    if (this.streakDays > 1) {
                        this.currentStreak = 'days';
                    } else if (this.streakWeeks > 1) {
                        this.currentStreak = 'weeks';
                    } else if (this.streakWeeks == 1 && this.streakMonths > 1) {
                        this.currentStreak = 'months';
                    }
                }
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";
    @import "transitions";

    .celebrate-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        justify-content: center;
        width: 100%;

        &.flip-container .flip-card.back,
        &.flip-container .flip-card.front {
            height: auto;
            justify-content: flex-start;
        }

        &.flip-container .flipper {
            @include r(600) {
                background: transparent;
                box-shadow: none;
            }
        }
    }

    .flip-card.front {
        visibility: visible;

        .flipped & {
            visibility: hidden;
        }
    }

    .flip-card.back {
        visibility: hidden;

        .flipped & {
            visibility: visible;
        }
    }

    .successText {
        flex-grow: 1;
        padding: 4rem 4rem 0;

        h2 {
            font-size: 3.2rem;
        }

        .subtext {
            opacity: .8;
        }
    }

    .insightContainer {
        padding: 0 1.6rem;
        width: 100%;
    }

    .stats-container {
        display: flex;
        justify-content: center;
        padding: 0 2.4rem 3.2rem;

        @include r(600) {
            justify-content: space-around;
            padding: 0 3.2rem 4rem;
        }
    }

    .metric {
        color: $dolphin;
        flex-basis: 30%;
        padding: .8rem;

        @include r(374) {
            @include shadowbox;
            margin: 0 .8rem;
            padding: 1.6rem;
        }
        @include r(600) {
            margin: 0;
        }

        p {
            font-size: 1.4rem;
            opacity: .8;
            white-space: nowrap;

            @include r(600) {
                font-size: 1.6rem;
            }
        }

        .icon {
            display: none;

            @include r(374) {
                display: inline-block;
            }
        }
    }

    .label {
        font-size: 3.2rem;
        font-weight: bold;
        text-align: center;
    }

    .auth {
        @include r(600) {
            margin: 0 -3.2rem;
        }
    }

    .back .illustration {
        margin-bottom: 1.6rem;
        width: 70%;
    }

    .flip-container {
        perspective: 1000px;

        .flipper {
            height: 100%;
            position: relative;
            transform-style: preserve-3d;
            transition: 0.3s;

            @include r(600) {
                border-radius: 12px;
                box-shadow: rgba(7, 69, 76, 0.18) 0 11px 28px -8px;
            }
        }

        &.flipped .flipper {
            transform: rotateY(180deg);
        }

        .flip-card {
            backface-visibility: hidden;
            display: flex;
            flex-direction: column;
            height: 100%;
            justify-content: center;
            left: 0;
            overflow: hidden;
            position: absolute;
            top: 0;
            width: 100%;

            @include r(600) {
                border-radius: 12px;
            }

            &.front {
                background-color: $bgGreen;
                box-shadow: 0 30px 160px -6px rgba(6, 69, 76, 0.3);
                height: 100%;
                transform: rotateY(0);
                z-index: 2;

                @include r(600) {
                    background-position: -55rem -90rem;
                    background-size: auto;
                    min-height: 66rem;
                }
            }

            &.back {
                background: $darkerGreen url(/assets/images/darkGreenNeedles.svg) 0 0/31rem;
                transform: rotateY(180deg);

                @include r(600) {
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
            }
        }
    }

    .btnContainer {
        display: flex;
        flex-flow: column wrap;
        justify-content: center;
        padding: 0 2.4rem 3.2rem;

        @include r(600) {
            flex-flow: row nowrap;
            padding: 0 3.2rem 4rem;

            .lowerBtn {
                height: 4.8rem;
            }
        }

        button.lowerBtn {
            box-shadow: none;
            margin: .4rem 0;
            white-space: nowrap;

            @include r(600) {
                margin: 0 .4rem;
                width: 50%;
            }

            &.secondary:hover {
                background-color: $white;
            }
        }
    }

    .flexContainer {
        display: flex;
        flex-direction: column-reverse;
        padding: 2.4rem 1.6rem;

        @include r(374) {
            flex-direction: row;
        }

        button {
            flex-grow: 1;
            margin: 0 .8rem;

            &.secondary:hover {
                background-color: $white;
            }
        }

        .backBtn {
            align-items: center;
            color: $white;
            display: flex;
            justify-content: center;

            svg {
                fill: $white;
                height: 1.4rem;
                margin-right: .8rem;
                transform: scale(-1);
                width: 1.4rem;
            }

            &:hover {
                background: transparent;
            }
        }
    }

    .auth-card {
        color: $white;
        padding: 2.4rem;

        @include r(600) {
            padding: 3.2rem;
        }

        h2 {
            color: $white;
            line-height: 1.1;
        }
    }

</style>
