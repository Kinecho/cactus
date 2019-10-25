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
                <div class="brandNew">
                    <h2>Connect with Friends</h2>
                    <p class="subtext">Hold yourself accountable. See when friends reflect and they'll see when you&nbsp;reflect.</p>
                    <img class="friendActivityimg" src="https://placekitten.com/300/250" alt="Example of friend activity"/>
                    <button class="getStarted">Get Started</button>
                </div>

                <h2>Friend Activity</h2>
                <transition name="fade-in" appear>
                    <div class="activityContainer">
                        <div class="activityCard">
                            <div class="avatar">
                                <img src="https://placekitten.com/44/44" alt="User avatar"/>
                            </div>
                            <div class="info">
                                <p class="date"># AGO</p>
                                <p class="description"><span class="name">NAME</span> reflected on, QUESTION?</p>
                            </div>
                        </div>
                    </div>
                </transition>
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

    .loading {
        display: flex;
        justify-content: center;
    }

    .contentContainer {
        max-width: 1200px;
        padding: 2.4rem;
    }

    .subtext {
        margin: 0 auto 2.4rem;
        max-width: 50rem;
        opacity: .8;
    }

    .friendActivityimg {
        display: block;
        margin: 0 auto 2.4rem;
    }

    .getStarted {
        margin-bottom: 3.2rem;
        width: 100%;

        @include r(600) {
            width: auto;
        }
    }

    .activityCard {
        background-color: $white;
        border-radius: 12px;
        box-shadow: rgba(7, 69, 76, 0.18) 0 11px 28px -8px;
        display: flex;
        margin-bottom: 3.2rem;
        padding: 1.6rem 2.4rem;
        text-align: left;

        @include r(374) {
            margin: 0 .8rem 3.2rem;
        }

        @include r(600) {
            margin: 0 auto 4.8rem;
            max-width: 64rem;
            padding: 2.4rem;
        }

        .date {
            font-size: 1.4rem;
        }

        .avatar {
            $avatarDiameter: 4.4rem;
            border-radius: 50%;
            height: $avatarDiameter;
            margin-right: .8rem;
            overflow: hidden;
            width: $avatarDiameter;

            img {
                width: 100%;
                height: 100%;
            }
        }

        .name {
            font-weight: bold;
        }
    }

</style>
