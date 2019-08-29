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
                            Reflections
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
                            Day Streak
                        </p>
                    </section>
                </div>
                <button class="primary authBtn" v-if="authLoaded && !loggedIn" @click="showLogin = true">
                    Sign Up to Save Your Progress
                </button>
                <button class="primary authBtn" v-if="authLoaded && loggedIn" @click="goToHome">Go Home</button>
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
                    Back to celebration
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
                        this.durationLabel = "Seconds"
                    } else {
                        this.durationLabel = "Minutes";
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
            }
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
            celebrations: Array<string>
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
                celebrations: ["Well done!","Nice work!","Way to go!"]
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
                return this.celebrations[Math.floor(Math.random() * this.celebrations.length)]
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
        justify-content: center;
        width: 100%;

        @include r(600) {
            max-height: 66rem;
            max-width: 48rem;
            position: relative;
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
            position: relative;
            transform-style: preserve-3d;
            transition: 0.6s;

            @include isTinyPhone {
                height: calc(100vh - 8rem);
            }

            @include biggerThanTinyPhone {
                height: calc(100vh - 10rem);
            }

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
                transform: rotateY(0);
                z-index: 2;
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
            /*position: fixed;*/
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


</style>
