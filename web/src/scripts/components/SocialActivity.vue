<template xmlns:v-clipboard="http://www.w3.org/1999/xhtml">
    <div class="socialActivity">
        <NavBar/>
        <div class="centered">
            <div class="loading" v-if="loading">
                <Spinner message="Loading"/>
            </div>
            <div v-if="error" class="alert error">
                {{error}}
            </div>

            <div class="contentContainer">

                <!-- if brand new -->
                <div class="brandNew">
                    <h1>Reflect with Friends</h1>
                    <p class="subtext">Connect and see when you reflect on the same prompt. Easily share, discuss, and grow&nbsp;<i>together</i>.</p>
                    <div class="activityCard demo">
                        <div class="avatar">
                            <img src="https://placekitten.com/44/44" alt="Ryan Brown, CEO"/>
                        </div>
                        <div class="info">
                            <p class="date">8min ago</p>
                            <p class="description"><span class="bold">Ryan Brown</span> reflected on <a href="#">If you had just one day left to live, what would you do?</a></p>
                        </div>
                    </div>
                    <button class="getStarted">Get Started</button>
                </div>
                <!-- end -->

                <!-- find your friends -->
                <div class="findFriends">
                    <h1>Find Your Friends</h1>
                    <p class="subtext">Invite people you know to join and reflect with you. Your reflections are always private unless you specifically share them.</p>
                    <button class="primary">Share your Invite Link</button>
                    <h2>Import Your Contacts</h2>
                    <p class="subtext">Import your contacts from email. Don't worry, you'll choose who to connect with before they're invited.</p>
                    <div class="btnContainer">
                        <button class="secondary small">Gmail</button>
                        <button class="secondary small">Yahoo</button>
                    </div>
                </div>

                <!-- if has friends -->
                <div class="flexContainer">
                    <h1>Friend Activity</h1>
                    <button class="secondary small">Add Friends</button>
                </div>
                <transition name="fade-in" appear>
                    <div class="activityContainer">

                        <!-- if has friends but no activity yet -->
                        <!-- <p class="subtext">No activity from friends just yet....so....yeah...</p> -->
                        <!-- end -->

                        <div class="activityCard">
                            <div class="avatar">
                                <img src="https://placekitten.com/44/44" alt="User avatar"/>
                            </div>
                            <div class="info">
                                <p class="date">8min ago</p>
                                <p class="description"><span class="bold">James Brown</span> accepted your friend request.</p>
                            </div>
                        </div>
                        <div class="activityCard">
                            <div class="avatar">
                                <img src="https://placekitten.com/44/44" alt="User avatar"/>
                            </div>
                            <div class="info">
                                <p class="date">2 days ago</p>
                                <p class="description"><span class="bold">Ryan Brown</span> wants to add you as a friend.</p>
                                <button class="small secondary">Add Friend</button>
                            </div>
                        </div>
                        <div class="activityCard">
                            <div class="avatar">
                                <img src="https://placekitten.com/44/44" alt="User avatar"/>
                            </div>
                            <div class="info">
                                <p class="date">1 week ago</p>
                                <p class="description"><span class="bold">Sarah Burgess</span> reflected on, <span class="bold">If you had just one day left to live what would you do?</span></p>
                            </div>
                        </div>
                        <div class="activityCard">
                            <div class="avatar">
                                <img src="https://placekitten.com/44/44" alt="User avatar"/>
                            </div>
                            <div class="info">
                                <p class="date">2 weeks ago</p>
                                <p class="description"><span class="bold">Bob Mulvihill</span> is on Cactus. Do you want to add them as a friend?</p>
                                <button class="secondary small">Add Friend</button>
                            </div>
                        </div>
                    </div>
                </transition>
                <!-- end -->

            </div>

        </div>
        <Footer/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import NavBar from "@components/NavBar.vue";
    import Footer from "@components/StandardFooter.vue";
    import Spinner from "@components/Spinner.vue";
    import CactusMember from "@shared/models/CactusMember";
    import CactusMemberService from '@web/services/CactusMemberService';
    import {Config} from "@web/config";
    import {ListenerUnsubscriber} from '@web/services/FirestoreService';
    import {PageRoute} from '@web/PageRoutes';
    import VueClipboard from 'vue-clipboard2';
    import SocialSharing from 'vue-social-sharing';
    import {QueryParam} from '@shared/util/queryParams'
    import {appendQueryParams} from '@shared/util/StringUtil'

    Vue.use(VueClipboard);
    Vue.use(SocialSharing);


    export default Vue.extend({
        components: {
            NavBar,
            Footer,
            Spinner
        },
        created() {
            this.memberUnsubscriber = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: ({member}) => {
                    this.member = member;
                    this.authLoaded = true;

                    if (!member) {
                        window.location.href = PageRoute.HOME;
                    }
                }
            })
        },
        destroyed() {
            if (this.memberUnsubscriber) {
                this.memberUnsubscriber();
            }
        },
        data(): {
            authLoaded: boolean,
            copySucceeded: boolean,
            member: CactusMember | undefined | null,
            memberUnsubscriber: ListenerUnsubscriber | undefined,
            error: string | undefined
        } {
            return {
                authLoaded: false,
                copySucceeded: false,
                member: undefined,
                memberUnsubscriber: undefined,
                error: undefined
            }
        },
        methods: {
            handleCopyError() {
                alert("Copied Failed");
            },
            handleCopySuccess() {
                this.copySucceeded = true;
                setTimeout(() => this.copySucceeded = false, 2000);
            }
        },
        computed: {
            loading(): boolean {
                return !this.authLoaded;
            },
            referralLink(): string | undefined {
                const url = `${Config.domain}`;
                const params: { [key: string]: string } = {
                    [QueryParam.UTM_SOURCE]: "cactus.app",
                    [QueryParam.UTM_MEDIUM]: "invite-friends"
                };
                if (this.member && this.member.email) {
                    params[QueryParam.REFERRED_BY_EMAIL] = this.member.email;
                }

                return appendQueryParams(url, params);
            }
        }
    })
</script>

<style lang="scss">
    @import "common";
    @import "mixins";
    @import "variables";
    @import "forms";
    @import "social";

    .socialActivity {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
    }

    header {
        width: 100%;
    }

    .centered {
        flex-grow: 1;
        width: 100%;
    }

    .loading {
        display: flex;
        justify-content: center;
    }

    .contentContainer {
        max-width: 1200px;
        padding: 3.2rem 1.6rem;

        @include r(600) {
            padding: 6.4rem 0;
        }
    }

    .subtext {
        opacity: .8;
    }

    .brandNew .subtext {
        margin: 0 auto 3.2rem;
        max-width: 48rem;
    }

    .getStarted {
        margin-bottom: 3.2rem;
        max-width: 24rem;
        width: 100%;

        @include r(600) {
            width: auto;
        }
    }

    .findFriends {
        max-width: 768px;
        text-align: left;

        .subtext {
            margin: 0 0 2.4rem;
            max-width: 60rem;
        }

        h2 {
            margin-top: 6.4rem;
        }

        .btnContainer {
            display: flex;

            button {
                flex-grow: 0;
                margin-right: .8rem;
            }
        }
    }

    .flexContainer {
        align-items: center;
        display: flex;
        justify-content: space-between;
        margin-bottom: 3.2rem;

        .secondary {
            flex-grow: 0;
        }
    }

    .activityCard {
        background-color: $white;
        border-radius: 12px;
        box-shadow: rgba(7, 69, 76, 0.18) 0 11px 28px -8px;
        display: flex;
        margin: 0 -.8rem 3.2rem;
        padding: 1.6rem;
        text-align: left;

        @include r(374) {
            margin: 0 .8rem 3.2rem;
            padding: 1.6rem 2.4rem;
        }

        @include r(600) {
            margin: 0 auto 3.2rem;
            max-width: 64rem;
            padding: 2.4rem;

            &.demo {
                max-width: 48rem;
            }
        }

        .date {
            font-size: 1.4rem;
            opacity: .8;
        }

        .avatar {
            $avatarDiameter: 6.4rem;
            border-radius: 50%;
            flex-shrink: 0;
            height: $avatarDiameter;
            margin-right: 1.6rem;
            overflow: hidden;
            width: $avatarDiameter;

            img {
                width: 100%;
                height: 100%;
            }
        }

        a {
            text-decoration: none;

            &:hover {
                color: $darkestGreen;
            }
        }

        .bold {
            font-weight: bold;
        }
    }

    .info button {
        margin-top: 1.6rem;
    }

</style>
