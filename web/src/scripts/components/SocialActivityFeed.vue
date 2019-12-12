<template xmlns:v-clipboard="http://www.w3.org/1999/xhtml">
    <!-- if has friends -->
    <div class="socialActivityFeed">
        <div class="flexContainer">
            <h1>Friend Activity</h1>
        </div>

        <div class="activityContainer">

            <!-- if has friends but no activity yet -->
            <!-- <p class="subtext">No activity from friends just yet....so....yeah...</p> -->
            <!-- end -->

            <Spinner v-if="isLoading"/>
            <template v-for="event in activityFeedEvents">
                <SocialActivityEvent :event="event"/>
            </template>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import NavBar from "@components/NavBar.vue";
    import Footer from "@components/StandardFooter.vue";
    import Spinner from "@components/Spinner.vue";
    import SocialFindFriends from "@components/SocialFindFriends.vue"
    import SocialActivityEvent from "@components/SocialActivityEvent.vue"
    import CactusMember from "@shared/models/CactusMember";
    import {Config} from "@web/config";
    import VueClipboard from 'vue-clipboard2';
    import SocialSharing from 'vue-social-sharing';
    import {QueryParam} from '@shared/util/queryParams'
    import {appendQueryParams} from '@shared/util/StringUtil'
    import {getSocialActivity} from '@web/social';
    import {SocialActivityFeedEvent} from "@shared/types/SocialTypes";

    Vue.use(VueClipboard);
    Vue.use(SocialSharing);


    export default Vue.extend({
        components: {
            NavBar,
            Footer,
            Spinner,
            SocialFindFriends,
            SocialActivityEvent
        },
        async created() {
            if (this.member?.id) {
                const feedResponse = await getSocialActivity(this.member);
                if (feedResponse.data.success) {
                    this.activityFeedEvents = feedResponse.data.results;
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
            }
        },
        computed: {
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

</style>
