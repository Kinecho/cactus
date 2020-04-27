<template>
    <div class="socialHome">
        <NavBar/>
        <div class="centered">
            <div class="contentContainer" v-if="!loading && member && friends.length > 0">
                <SocialActivityFeed :member="member"/>
            </div>
            <div class="no-friends emptyState" v-if="!loading && friends.length === 0">
                <div class="graphic">
                    <SocialActivityCard
                        avatarUrl="/assets/images/avatars/blobatar2.png"
                        date="7 minutes ago"
                        name="Mary Demoss"
                        promptContentPath="https://cactus.app/prompts/zTVQbvum95ENWV2Do3xE"
                        promptQuestion="Who energizes you?"/>
                    <SocialActivityCard
                        avatarUrl="/assets/images/avatars/blobatar1.png"
                        date="8 hours ago"
                        name="Aaron Nichols"
                        promptContentPath="https://cactus.app/prompts/P0LRm37OKPBwCAHivbXG"
                        promptQuestion="What helps you feel calm?"/>
                    <SocialActivityCard
                        avatarUrl="/assets/images/avatars/blobatar3.png"
                        date="1 day ago"
                        name="Patricia Smith"
                        promptContentPath="https://cactus.app/prompts/cPOoU4Lfv6z3nEJ5YZoZ"
                        promptQuestion="What are you grateful for this week?"/>
                </div>
                <h1>Mindful Friends</h1>
                <p class="subtext">Your mindfulness journey is more effective when you share it with&nbsp;others.</p>
                <a class="button primary wiggle" :href="friendsPath">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path fill="#fff" d="M12 14a5 5 0 015 5v2a1 1 0 01-2 0v-2a3 3 0 00-3-3H5a3 3 0 00-3 3v2a1 1 0 01-2 0v-2a5 5 0 015-5zm8-7a1 1 0 011 1l-.001 1.999L23 10a1 1 0 01.993.883L24 11a1 1 0 01-1 1l-2.001-.001L21 14a1 1 0 01-.883.993L20 15a1 1 0 01-1-1l-.001-2.001L17 12a1 1 0 01-.993-.883L16 11a1 1 0 011-1l1.999-.001L19 8a1 1 0 01.883-.993zM8.5 2a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6z"/>
                    </svg>
                    Add a Friend
                </a>
            </div>
        </div>
        <Footer/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {ListenerUnsubscriber} from '@web/services/FirestoreService'
    import CactusMember from "@shared/models/CactusMember"
    import CactusMemberService from "@web/services/CactusMemberService"
    import SocialConnectionService from '@web/services/SocialConnectionService';
    import SocialConnection from "@shared/models/SocialConnection";
    import {PageRoute} from "@shared/PageRoutes"
    import {QueryParam} from '@shared/util/queryParams'
    import NavBar from "@components/NavBar.vue";
    import Footer from "@components/StandardFooter.vue";
    import SocialActivityFeed from "@components/SocialActivityFeed.vue"
    import SocialActivityCard from "@components/SocialActivityCard.vue"
    import VueClipboard from "vue-clipboard2";
    import SocialSharing from "vue-social-sharing";

    Vue.use(VueClipboard);
    Vue.use(SocialSharing);


    export default Vue.extend({
        components: {
            NavBar,
            Footer,
            SocialActivityCard,
            SocialActivityFeed
        },
        data(): {
            currentChild: string,
            loading: boolean,
            member: CactusMember | undefined,
            memberUnsubscriber: ListenerUnsubscriber | undefined,
            friends: Array<SocialConnection>,
            friendsUnsubscriber?: ListenerUnsubscriber | undefined,
        } {
            return {
                currentChild: 'findFriends',
                loading: true,
                member: undefined,
                memberUnsubscriber: undefined,
                friendsUnsubscriber: undefined,
                friends: []
            }
        },
        beforeMount() {
            this.memberUnsubscriber = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: ({member}) => {
                    if (!member) {
                        window.location.href = `${PageRoute.LOGIN}?${QueryParam.REDIRECT_URL}=${encodeURIComponent(PageRoute.SOCIAL)}`;
                    } else {
                        if (this.member?.id != member.id) { // only update instance if switching users
                            this.member = member;

                            if (this.member?.id) {
                                this.friendsUnsubscriber?.();
                                this.friendsUnsubscriber = SocialConnectionService.sharedInstance.observeConnections(this.member.id, {
                                    onData: (socialConnections: SocialConnection[]) => {
                                        this.friends = socialConnections;
                                        this.loading = false;
                                    }
                                });
                            }
                        }
                    }
                }
            })
        },
        methods: {
            setVisible(child: string) {
                this.currentChild = child;
            }
        },
        computed: {
            friendsPath() {
                return PageRoute.FRIENDS;
            }
        },
        destroyed() {
            this.memberUnsubscriber?.();
            this.friendsUnsubscriber?.();
        },

    })
</script>

<style lang="scss">
    @import "common";
    @import "mixins";
    @import "variables";
    @import "forms";
    @import "social";
    @import "transitions";

    .socialHome {
        display: flex;
        flex-flow: column nowrap;
        justify-content: space-between;

        @include r(600) {
            min-height: 100vh;
        }

        header, .centered {
            width: 100%;
        }

        footer {
            flex-shrink: 0;
        }
    }

    header {
        width: 100%;
    }

    .centered {
        flex-grow: 1;
        text-align: left;
        width: 100%;
    }

    .contentContainer {
        max-width: 1200px;
        padding: 3.2rem 2.4rem 6.4rem;

        @include r(600) {
            padding: 6.4rem 2.4rem;
        }
        @include r(768) {
            padding: 6.4rem 1.6rem;
        }
        @include r(1200) {
            padding: 6.4rem 0;
        }
    }

    .no-friends {
        align-items: center;
        display: flex;
        flex-direction: column;
        padding: 0 2.4rem 6.4rem;
        text-align: center;

        @include r(600) {
            padding: 6.4rem 2.4rem 12rem;
        }

        h1 {
            line-height: 1.2;
            margin-bottom: .4rem;
        }

        .subtext {
            margin: 0 auto 2.4rem;
            max-width: 40rem;
            opacity: .8;

            @include r(768) {
                margin-bottom: 1.6rem;
            }
        }

        .graphic {
            margin: 1.6rem 0;
            position: relative;

            &:after {
                background: linear-gradient(rgba(255,255,255,0), $white 98%);
                bottom: 0;
                content: '';
                display: block;
                height: 100%;
                left: 0;
                margin: 0 0 0 -2.4rem;
                position: absolute;
                width: calc(100% + 4.8rem);
            }
        }

        .activityCard {
            @include r(600) {
                margin-bottom: 1.6rem;
            }

            &:last-of-type {
                box-shadow: none;
                margin-bottom: 0;
            }
        }

        .button {
            align-items: center;
            display: flex;
            justify-content: center;
            min-width: 22rem;

            svg {
                height: 2rem;
                margin-right: .8rem;
                width: 2rem;
            }
        }
    }
</style>
