<template>
    <div :class="['flip-container', 'celebrate-container', {flipped: showLogin}]">
        <div class="flipper">
            <div :class="['front', 'flip-card']">
                <h2>{{celebrateText}}</h2>
                <img src="/assets/images/celebrate2.svg" class="illustration" alt="Celebrate!"/>
                <div class="stats-container">
                    <section class="metric">
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
                    <section class="metric">
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
                </div>
                <section class="doorTest">
                    <div class="door tradeDoor" @click="openDoor()" v-show="!doorOpen">
                        <h3>Trade Notes</h3>
                        <p>Choose someone to trade notes with. Once you've both reflected, your notes will be shared.</p>
                    </div>
                    <div class="door psychDoor" v-show="doorOpen">
                        <h3>Coming Soon!</h3>
                        <p>We'll let you know when trading notes is available. In the meantime, enjoy these <a href="https://drive.google.com/drive/folders/18uUI3pSWEZG2-GvAyX_w88zKO1lk3DAm?usp=sharing" target="_blank">Cactus wallpapers</a>.</p>
                        <button @click="closeDoor()" class="icon tertiary">
                            <svg class="closeButton" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14"><path fill="#29A389" d="M8.414 7l5.293 5.293a1 1 0 0 1-1.414 1.414L7 8.414l-5.293 5.293a1 1 0 1 1-1.414-1.414L5.586 7 .293 1.707A1 1 0 1 1 1.707.293L7 5.586 12.293.293a1 1 0 0 1 1.414 1.414L8.414 7z"/></svg>
                        </button>
                    </div>
                    <div class="door shareDoor">
                        <h3>Share Your Note</h3>
                        <p>Boost someone’s day with a quick dose of gratitude</p>
                    </div>
                </section>
                <button class="primary authBtn" v-if="authLoaded && !loggedIn" @click="showLogin = true">
                    {{promptCopy.SIGN_UP_MESSAGE}}
                </button>
                <button class="primary authBtn"
                        v-if="authLoaded && loggedIn && !isModal"
                        @click="goToHome">
                    {{promptCopy.GO_HOME}}
                </button>
                <button class="primary authBtn"
                        v-if="authLoaded && loggedIn && isModal"
                        @click="close">
                    {{promptCopy.CLOSE}}
                </button>
            </div>
            <div :class="[ 'flip-card', 'back']">
                <div class="auth-card">
                    <img src="/assets/images/balloons.svg" class="illustration" alt=""/>
                    <h2 class="green">Become a better version of yourself</h2>
                    <p class="subtext">
                        Questions to help you become more mindful and reflect on what makes you happy.
                    </p>
                    <div class="auth" v-if="authLoaded && !loggedIn">
                        <magic-link v-on:success="magicLinkSuccess" @error="magicLinkError"/>
                    </div>
                </div>
                <button @click="showLogin = false" class="backBtn tertiary">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                        <path d="M12.586 7L7.293 1.707A1 1 0 0 1 8.707.293l7 7a1 1 0 0 1 0 1.414l-7 7a1 1 0 1 1-1.414-1.414L12.586 9H1a1 1 0 1 1 0-2h11.586z"/>
                    </svg>
                    Go Back
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Spinner from "@components/Spinner.vue";
    import ReflectionResponseService from '@web/services/ReflectionResponseService'
    import {millisecondsToMinutes} from '@shared/util/DateUtil'
    import ReflectionResponse from '@shared/models/ReflectionResponse'
    import CactusMemberService from '@web/services/CactusMemberService'
    import {ListenerUnsubscriber} from '@web/services/FirestoreService'
    import CactusMember from '@shared/models/CactusMember'
    import {PageRoute} from '@web/PageRoutes'
    import MagicLink from "@components/MagicLinkInput.vue";
    import StorageService, {LocalStorageKey} from '@web/services/StorageService'
    import CopyService from '@shared/copy/CopyService'
    import {PromptCopy} from '@shared/copy/CopyTypes'

    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
        components: {
            Spinner,
            MagicLink,
        },
        async created() {

            CactusMemberService.sharedInstance.observeCurrentMember({
                onData: async ({member}) => {
                    this.member = member;
                    this.authLoaded = true;
                    this.loggedIn = !!member;

                    const reflections = await ReflectionResponseService.sharedInstance.getAllReflections();
                    console.log("all reflections", reflections);
                    if (reflections.length === 0 && this.reflectionResponse) {
                        reflections.push(this.reflectionResponse);
                    }

                    const totalDuration = reflections.reduce((duration, doc) => {
                        const current = doc.reflectionDurationMs || 0;
                        console.log("current response duration ", current);
                        return duration + (Number(current) || 0);
                    }, 0);


                    console.log("totalDuration", totalDuration);
                    if (totalDuration < (60 * 1000)) {
                        this.totalDuration = `${Math.round(totalDuration / 1000)}`;
                        this.durationLabel = copy.prompts.SECONDS
                    } else {
                        this.durationLabel = copy.prompts.MINUTES;
                        this.totalDuration = millisecondsToMinutes(totalDuration);
                    }


                    this.reflectionCount = reflections.length;
                    this.streakDays = ReflectionResponseService.getCurrentStreak(reflections);
                    this.loading = false;
                }
            });
        },
        props: {
            reflectionResponse: {
                type: Object as () => ReflectionResponse
            },
            isModal: Boolean,
        },
        data(): {
            reflectionCount: number | undefined,
            totalDuration: string | undefined,
            streakDays: number | undefined,
            loading: boolean,
            authLoaded: boolean,
            loggedIn: boolean,
            authUnsubscriber: ListenerUnsubscriber | undefined,
            member: CactusMember | undefined,
            showLogin: boolean,
            durationLabel: string,
            promptCopy: PromptCopy,
            doorOpen: boolean,
        } {
            return {
                reflectionCount: undefined,
                totalDuration: undefined,
                streakDays: undefined,
                loading: true,
                loggedIn: false,
                authLoaded: false,
                authUnsubscriber: undefined,
                member: undefined,
                showLogin: false,
                durationLabel: "",
                promptCopy: copy.prompts,
                doorOpen: false,
            }
        },
        destroyed() {
            if (this.authUnsubscriber) {
                this.authUnsubscriber();
            }
        },
        computed: {
            loginUrl(): string {
                const base = `${PageRoute.SIGNUP}`;
                // const params = {}
                return base;
            },
            celebrateText(): string {
                const celebrations = copy.prompts.CELEBRATIONS;
                return celebrations[Math.floor(Math.random() * celebrations.length - 1)]
            }
        },
        methods: {
            goToHome() {
                window.location.href = PageRoute.JOURNAL_HOME;
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
            openDoor() {
                this.doorOpen = true;
            },
            closeDoor() {
                this.doorOpen = false;
            },
            magicLinkSuccess(email: string | undefined) {
                console.log("Celebrate Screen: Magic link sent successfully to ", email);
                if (this.reflectionResponse && this.reflectionResponse.promptId) {
                    StorageService.removeItem(LocalStorageKey.anonReflectionResponse, this.reflectionResponse.promptId);
                }
            },
            magicLinkError(message: string | undefined) {
                console.error("Celebrate component: Failed to send magic link", message);
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

        @include r(600) {
            &.flip-container .flip-card.front {
                height: auto;
            }
        }
    }

    h2 {
        color: $darkestPink;
        margin-bottom: 2.4rem;

        @include r(600) {
            margin-bottom: 3.2rem;
        }

        &.green {
            color: $darkestGreen;
        }
    }

    .subtext {
        margin: -1.6rem 0 .8rem;
        opacity: .8;

        @include r(600) {
            margin-top: -2.4rem;
        }
    }

    .front .illustration {
        margin-bottom: 3.2rem;
        width: 100%;
    }

    .back .illustration {
        margin-bottom: 1.6rem;
        width: 70%;
    }

    .stats-container {
        display: flex;
        justify-content: center;
        margin-bottom: 3.2rem;
    }

    .metric {
        width: 10rem;

        @include r(600) {
            width: 11rem;
        }

        p {
            font-size: 1.6rem;
        }
    }

    .label {
        font-size: 4.8rem;
        font-weight: bold;
        text-align: center;
    }

    .auth {
        @include r(600) {
            margin: 0 -3.2rem;
        }
    }

    .flip-container {
        perspective: 1000px;

        .flipper {
            height: 100%;
            position: relative;
            transform-style: preserve-3d;
            transition: 0.6s;

            @include r(600) {
                border-radius: 12px;
                box-shadow: rgba(7, 69, 76, 0.18) 0 11px 28px -8px;
            }
        }

        &.flipped {
            .flipper {
                transform: rotateY(180deg);
            }
        }

        .flip-card {
            backface-visibility: hidden;
            display: flex;
            flex-direction: column;
            height: 100%;
            justify-content: center;
            left: 0;
            overflow: hidden;
            padding: 3.2rem;
            position: absolute;
            top: 0;
            width: 100%;

            @include r(600) {
                border-radius: 12px;
            }

            &.front {
                background-color: lighten($lightPink, 3%);
                height: 100%;
                transform: rotateY(0);
                z-index: 2;

                @include r(600) {
                    min-height: 66rem;
                }
            }

            &.back {
                background: url(assets/images/yellowNeedles.svg) $yellow;
                background-size: 80%;
                transform: rotateY(180deg);

                @include r(600) {
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
            }
        }

        /* Lower Buttons */

        .authBtn,
        .backBtn {
            bottom: 3.2rem;
            flex-grow: 0;
            left: 3.2rem;
            margin: 3.2rem auto 0;
            right: 3.2rem;
            width: calc(100% - 6.4rem);

            @include r(600) {
                max-width: none;
                position: static;
                width: auto;
            }
        }

        .authBtn {
            bottom: 1.2rem; //before changing this bottom setting, the button was covering the metric labels on small screens
        }

        .backBtn {
            align-items: center;
            display: flex;
            justify-content: center;

            svg {
                fill: $darkGreen;
                height: 1.6rem;
                margin-right: .8rem;
                transform: scale(-1);
                width: 1.6rem;
            }
        }
    }

    .door {
        @include shadowbox;
        background-repeat: no-repeat;
        cursor: pointer;
        margin-bottom: 1.6rem;
        padding: 1.6rem 9.6rem 1.6rem 2.4rem;
        position: relative;
        text-align: left;

        @include r(600) {
            transition: transform .3s;

            &:hover {
                transform: scale(1.03);
            }
        }

        &.tradeDoor {
            background-image: url(/assets/images/maroonTriangleBlob.svg), url(/assets/images/pinkBlob4.svg);
            // background-size: 36rem, 25rem;
            // background-position: right -24rem top -5rem, right -10rem top -11rem;
            background-size: 32rem, 25rem;
            background-position: right -21rem top 0, right -11rem top -12rem;
        }

        &.shareDoor {
            background-image: url(/assets/images/greenNeedleBlob.svg), url(/assets/images/lightGreenBlob.svg);
            background-size: 32rem, 29rem;
            background-position: right -23rem top 1rem, right -13rem top 5rem;
        }

        h3 {
            margin-bottom: .4rem;
        }
    }

    .psychDoor {
        background-color: $darkestGreen;
        color: $white;
        padding-right: 2.4rem;

        p {
            opacity: .9;
        }

        a {
            @include fancyLinkLight;
            opacity: 1;
        }

        .icon.tertiary {
            position: absolute;
            right: .8rem;
            top: .8rem;
        }

        .closeButton {
            height: 1.4rem;
            width: 1.4rem;
        }
    }


</style>
