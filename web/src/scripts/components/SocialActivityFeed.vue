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
                <template v-if="isLoading">
                    <Spinner/>
                </template>
                <a class="primary button add-friends" :href="friendsPath">Add Friends</a>
            </div>
            <template v-for="event in [1,2,3,4,5]" v-if="isLoading">
                <skeleton-event />
            </template>
            <p class="subtext" v-if="!isLoading && activityFeedEvents.length < 1">Nothing to see (yet).</p>
            <template v-for="event in activityFeedEvents">
                <SocialActivityEvent :event="event"/>
            </template>
        </div>

        <!-- Friend List -->
        <div class="socialFriendList">
            <friend-list v-bind:member="member"/>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import NavBar from "@components/NavBar.vue";
    import Footer from "@components/StandardFooter.vue";
    import Spinner from "@components/Spinner.vue";
    import SocialActivityEvent from "@components/SocialActivityEvent.vue"
    import CactusMember from "@shared/models/CactusMember";
    import CactusMemberService from '@web/services/CactusMemberService';
    import {Config} from "@web/config";
    import VueClipboard from 'vue-clipboard2';
    import SocialSharing from 'vue-social-sharing';
    import {QueryParam} from '@shared/util/queryParams'
    import {appendQueryParams} from '@shared/util/StringUtil'
    import {getSocialActivity} from '@web/social';
    import {SocialActivityFeedEvent} from "@shared/types/SocialTypes";
    import SocialFriendNotifications from "@components/SocialFriendNotifications.vue";
    import {PageRoute} from "@shared/PageRoutes";
    import SocialFriendList from "@components/SocialFriendList.vue";
    import SkeletonEvent from "@components/SocialActivityEventSkeleton.vue";

    Vue.use(VueClipboard);
    Vue.use(SocialSharing);


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
            friendsPath() {
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

<style lang="scss">
    @import "common";
    @import "mixins";
    @import "variables";
    @import "forms";
    @import "transitions";

    .socialActivityFeed {
        margin: 0 auto;
        max-width: 60rem;
        position: relative;

        @include r(960) {
            display: grid;
            grid-column-gap: 6.4rem;
            grid-template-columns: 1fr minmax(38rem, 33%);
            margin: 0;
            max-width: none;
        }
    }

    .activityContainer {
        margin-bottom: 4.8rem;

        @include r(600) {
            grid-column: 1;
            grid-row: 1 / 3;
            margin-bottom: 6.4rem;
        }

        h2 {
            margin-bottom: 1.6rem;
        }
    }

    .loading {
        display: flex;
        justify-content: center;
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
        max-width: 64rem;

        .button {
            flex-grow: 0;
        }
    }

    .socialFriendList {
        display: none;

        @include r(768) {
            display: block;
        }
    }

</style>
