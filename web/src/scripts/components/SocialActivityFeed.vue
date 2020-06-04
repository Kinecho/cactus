<template xmlns:v-clipboard="http://www.w3.org/1999/xhtml">
    <!-- if has friends -->
    <div class="socialActivityFeed">
        <!-- suggested friends / friend requests -->
        <div class="socialFriendNotifications" v-if="member">
            <social-friend-notifications v-bind:member="member"/>
        </div>

        <div class="activityContainer">
            <div class="flexContainer">
                <h2>Activity</h2>
                <router-link class="secondary wiggle button add-friends" :to="friendsPath"><img src="/assets/images/addUser.svg" alt=""/>Add
                    Friends</router-link>
            </div>
            <template v-for="event in [1,2,3,4,5]" v-if="isLoading">
                <skeleton-event/>
            </template>
            <template v-for="event in activityFeedEvents">
                <SocialActivityEvent :event="event" :viewer="member"/>
            </template>
            <p class="subtext" v-if="!isLoading && !hasActivity">
                Nothing to see (yet).
            </p>
        </div>

        <!-- Friend List -->
        <div class="socialFriendList">
            <friend-list v-bind:member="member"/>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import CactusMember from "@shared/models/CactusMember";
    import {SocialActivityFeedEvent} from "@shared/types/SocialTypes";
    import {PageRoute} from "@shared/PageRoutes";
    import CactusMemberService from '@web/services/CactusMemberService';
    import {getSocialActivity} from '@web/social';
    import NavBar from "@components/NavBar.vue";
    import Spinner from "@components/Spinner.vue";
    import Footer from "@components/StandardFooter.vue";
    import VueClipboard from 'vue-clipboard2';
    import SocialFriendList from "@components/SocialFriendList.vue";
    import SocialFriendNotifications from "@components/SocialFriendNotifications.vue";
    import SkeletonEvent from "@components/SocialActivityEventSkeleton.vue";
    import SocialActivityEvent from "@components/SocialActivityEvent.vue"

    Vue.use(VueClipboard);

    export default Vue.extend({
        components: {
            NavBar,
            Footer,
            Spinner,
            SocialActivityEvent,
            SocialFriendNotifications,
            FriendList: SocialFriendList,
            SkeletonEvent
        },
        async beforeMount() {
            if (this.member?.id) {
                const feedResponse = await getSocialActivity(this.member);
                if (feedResponse.success) {
                    this.activityFeedEvents = feedResponse.results;
                    this.updateLastSeen();
                }
                this.isLoading = false;
            }
        },
        props: {
            member: {
                type: Object as () => CactusMember,
                required: true,
            }
        },
        data(): {
            activityFeedEvents: SocialActivityFeedEvent[] | undefined,
            copySucceeded: boolean,
            error: string | undefined,
            currentChild: string | undefined,
            isLoading: boolean,
        } {
            return {
                isLoading: true,
                activityFeedEvents: undefined,
                copySucceeded: false,
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
            },
            updateLastSeen() {
                if (this.latestActivity?.occurredAt && this.member) {
                    this.member.activityStatus = {
                        lastSeenOccurredAt: new Date(this.latestActivity.occurredAt)
                    };
                    CactusMemberService.sharedInstance.save(this.member);
                }
            },
        },
        computed: {
            hasActivity(): boolean {
                return this.activityFeedEvents && this.activityFeedEvents.length > 0 || false
            },
            friendsPath(): PageRoute {
                return PageRoute.FRIENDS;
            },
            latestActivity(): SocialActivityFeedEvent | undefined {
                if (this.activityFeedEvents && this.activityFeedEvents[0]) {
                    return this.activityFeedEvents[0];
                }
                return undefined;
            }
        },
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";
    @import "forms";
    @import "transitions";

    .socialActivityFeed {
        margin: 0 auto;
        max-width: 60rem;

        @include r(960) {
            display: grid;
            grid-column-gap: 6.4rem;
            grid-template-columns: 1fr minmax(38rem, 33%);
            grid-template-rows: max-content 1fr;
            margin: 0;
            max-width: none;
        }

        .flexContainer {
            align-items: center;
            display: flex;
            justify-content: space-between;
            margin-bottom: 2.4rem;
            max-width: 64rem;

            a.button.secondary {
                @include smallButton;
                display: flex;
                flex-grow: 0;

                @include r(374) {
                    @include secondaryButton;
                }

                img {
                    height: 2rem;
                    margin-right: .8rem;
                    width: 2rem;
                }
            }
        }
    }

    .activityContainer {
        margin-bottom: 4.8rem;

        @include r(600) {
            grid-column: 1;
            grid-row: 1 / 3;
            margin-bottom: 6.4rem;
        }
    }

    .loading {
        display: flex;
        justify-content: center;
    }



</style>
