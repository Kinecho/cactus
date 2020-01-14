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
                        avatarURL="https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2FxLeo5gYlAqvqhJ4IQV8y_memory2.png?alt=media&token=82f832f7-3d77-40ec-84a1-343d88f73d37"
                        date="7 minutes ago"
                        name="Richard Wolf"
                        promptContentPath="/prompts/1234"
                        promptQuestion="Who energizes you?"/>
                    <SocialActivityCard
                        avatarURL="https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2FvbK9t2qyY9MprQ0171zD_lost1.png?alt=media&token=46e59600-c8c5-4c05-bf3f-bd80bf63142d"
                        date="8 hours ago"
                        name="Nikky Nealon"
                        promptContentPath="/prompts/1234"
                        promptQuestion="If you can only accomplish one thing this coming week, what will it be?"/>
                    <SocialActivityCard
                        avatarURL="https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2FvWQvgnCOIeZxDFpqGNnA_focus1.png?alt=media&token=2b6cbc37-9794-46c2-bfc9-9299ba7bd4c8"
                        date="1 day ago"
                        name="Patricia Smith"
                        promptContentPath="/prompts/1234"
                        promptQuestion="If you can only accomplish one thing this coming week, what will it be?"/>
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
    import NavBar from "@components/NavBar.vue";
    import Footer from "@components/StandardFooter.vue";
    import SocialActivityCard from "@components/SocialActivityCard.vue"
    import SocialActivityFeed from "@components/SocialActivityFeed.vue"
    import {ListenerUnsubscriber} from '@web/services/FirestoreService'
    import CactusMember from "@shared/models/CactusMember"
    import CactusMemberService from "@web/services/CactusMemberService"
    import {PageRoute} from "@shared/PageRoutes"
    import {QueryParam} from '@shared/util/queryParams'
    import SocialConnectionService from '@web/services/SocialConnectionService';
    import SocialConnection from "@shared/models/SocialConnection";

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
            margin-bottom: 2.4rem;
            position: relative;

            &:after {
                background: linear-gradient(rgba(255,255,255,0), $white);
                bottom: 0;
                content: '';
                display: block;
                height: 75%;
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
