<template xmlns:v-clipboard="http://www.w3.org/1999/xhtml">                    
    <!-- if has friends -->
    <div class="socialActivityFeed">
        <div class="flexContainer">
            <h1>Friend Activity</h1>
            <button class="secondary small" @click.prevent="setVisible('findFriends')">Add Friends</button>
        </div>

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
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import NavBar from "@components/NavBar.vue";
    import Footer from "@components/StandardFooter.vue";
    import Spinner from "@components/Spinner.vue";
    import SocialFindFriends from "@components/SocialFindFriends.vue"
    import CactusMember from "@shared/models/CactusMember";
    import CactusMemberService from '@web/services/CactusMemberService';
    import {Config} from "@web/config";
    import {ListenerUnsubscriber} from '@web/services/FirestoreService';
    import {PageRoute} from '@shared/PageRoutes';
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
            Spinner,
            SocialFindFriends
        },
        beforeMount() {
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
        created() {
            this.currentChild = 'welcome';
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
            error: string | undefined,
            currentChild: string | undefined
        } {
            return {
                authLoaded: false,
                copySucceeded: false,
                member: undefined,
                memberUnsubscriber: undefined,
                error: undefined,
                currentChild: undefined
            }
        },
        methods: {
            handleCopyError() {
                alert("Copied Failed");
            },
            handleCopySuccess() {
                this.copySucceeded = true;
                setTimeout(() => this.copySucceeded = false, 2000);
            },
            setVisible(child: string) {
                this.currentChild = child;
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
    @import "transitions";

    .socialActivityFeed {
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

    .subtext {
        opacity: .8;
    }

    .brandNew .subtext {
        margin: 0 auto 3.2rem;
        max-width: 48rem;
    }

    .getStarted {
        margin-bottom: 6.4rem;
        max-width: 24rem;
        width: 100%;

        @include r(600) {
            width: auto;
        }
    }

    .findFriends {
        margin: 0 auto 6.4rem;
        max-width: 960px;
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
        margin: 0 auto 3.2rem;
        max-width: 960px;

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

    .email,
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

    .info button {
        margin-top: 1.6rem;
    }

</style>
