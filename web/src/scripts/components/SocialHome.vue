<template>
    <div class="socialHome">
        <NavBar/>
        <div class="centered">
            <div class="contentContainer" v-if="!loading && member && friends.length > 0">
                <SocialActivityFeed :member="member" v-if="member"/>
            </div>
            <div class="no-friends emptyState" v-if="!loading && friends.length == 0">
                You have no friends on Cactus.
                <a class="primary button" :href="friendsPath">Add Friends</a>
            </div>
        </div>
        <Footer/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import NavBar from "@components/NavBar.vue";
    import Footer from "@components/StandardFooter.vue";
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
            SocialActivityFeed
        },
        data(): {
            currentChild: string,
            loading: boolean,
            member: CactusMember|undefined,
            memberUnsubscriber: ListenerUnsubscriber|undefined,
            friends: Array<SocialConnection>,
            friendsUnsubscriber?: ListenerUnsubscriber|undefined,
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
                    }
                    this.member = member;
                    this.loading = false;

                    if (this.member?.id) {
                        this.friendsUnsubscriber = SocialConnectionService.sharedInstance.observeConnections(this.member.id, {
                            onData: async (socialConnections: SocialConnection[]): Promise<void> => {
                                this.friends = socialConnections;
                            }
                        });
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
</style>
