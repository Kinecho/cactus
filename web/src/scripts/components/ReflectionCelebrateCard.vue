import {LocalStorageKey} from '@web/util'
<template>
    <div class="celebrate-container">
        <h2>Whoop, whoop!<br/>You did it!</h2>
        <img src="/assets/images/celebrate2.svg" class="illustration" alt="Celebrate!"/>
        <div class="stats-container">
            <section class="metric">
                <div class="label">
                    <transition name="fade-in" mode="out-in" appear>
                        <span v-if="reflectionCount !== undefined">{{reflectionCount}}</span>
                        <spinner v-if="reflectionCount === undefined" :delay="1000"/>
                    </transition>
                </div>
                <p>
                    Reflections
                </p>
            </section>
            <section class="metric">
                <div class="label">
                    <transition name="fade-in" mode="out-in" appear>
                        <span v-if="totalMinutes !== undefined">{{totalMinutes}}</span>
                        <spinner v-if="totalMinutes === undefined" :delay="1000"/>
                    </transition>
                </div>
                <p>
                    Minutes
                </p>
            </section>
            <section class="metric">
                <div class="label">
                    <transition name="fade-in" mode="out-in" appear>
                        <span v-if="streakDays !== undefined">{{streakDays}}</span>
                        <spinner v-if="streakDays === undefined" :delay="1000"/>
                    </transition>
                </div>
                <p>
                    Day Streak
                </p>
            </section>

        </div>
        <button class="primary authBtn" v-if="authLoaded && !loggedIn">Save My Stats</button>
        <div class="auth" v-if="authLoaded && !loggedIn">
            <magic-link v-on:success="magicLinkSuccess" @error="magicLinkError"/>
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
    import StorageService from '@web/services/StorageService'
    import {LocalStorageKey} from "@web/util"

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

                    if (reflections.length === 0 && this.reflectionResponse) {
                        reflections.push(this.reflectionResponse);
                    }

                    const totalDuration = reflections.reduce((duration, doc) => {
                        const current = doc.reflectionDurationMs || 0;
                        console.log("current response duration ", current);
                        return duration + (Number(current) || 0);
                    }, 0);

                    this.totalMinutes = millisecondsToMinutes(totalDuration);
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
            totalMinutes: string | undefined,
            streakDays: number | undefined,
            loading: boolean,
            authLoaded: boolean,
            loggedIn: boolean,
            authUnsubscriber: ListenerUnsubscriber | undefined,
            member: CactusMember | undefined,
        } {
            return {
                reflectionCount: undefined,
                totalMinutes: undefined,
                streakDays: undefined,
                loading: true,
                loggedIn: false,
                authLoaded: false,
                authUnsubscriber: undefined,
                member: undefined,
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
        },
        methods: {
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
        background-color: lighten($lightPink, 3%);
        display: flex;
        flex-direction: column;
        height: 100vh;
        justify-content: center;
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

    h2 {
        color: $darkestPink;
        margin-bottom: 2.4rem;

        @include r(600) {
            margin-bottom: 3.2rem;
        }
    }

    .illustration {
        margin-bottom: 3.2rem;
        width: 100%;
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

    .authBtn {
        flex-grow: 0;
        margin: 3.2rem auto 0;
    }

    .auth {
        display: none;
    }


</style>
