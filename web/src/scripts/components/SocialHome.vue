<template>
    <div class="socialHome">
        <NavBar/>
        <div class="centered">
            <div class="contentContainer" v-if="!loading && member">
                <SocialFindFriends v-if="currentChild === 'findFriends'" :member="member"/>
                <SocialActivityFeed :member="member" v-if="member"/>
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
    import SocialFindFriends from "@components/SocialFindFriends.vue"
    import {ListenerUnsubscriber} from '@web/services/FirestoreService'
    import CactusMember from "@shared/models/CactusMember"
    import CactusMemberService from "@web/services/CactusMemberService"
    import {PageRoute} from "@shared/PageRoutes"
    import {QueryParam} from '@shared/util/queryParams'

    export default Vue.extend({
        components: {
            NavBar,
            Footer,
            SocialFindFriends,
            SocialActivityFeed
        },
        data(): {
            currentChild: string,
            loading: boolean,
            member: CactusMember|undefined,
            memberUnsubscriber: ListenerUnsubscriber|undefined,
        } {
            return {
                currentChild: 'findFriends',
                loading: true,
                member: undefined,
                memberUnsubscriber: undefined,
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
                }
            })
        },
        methods: {
            setVisible(child: string) {
                this.currentChild = child;
            }
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

    // .brandNew .subtext {
    //     margin: 0 auto 3.2rem;
    //     max-width: 48rem;
    // }

    // .getStarted {
    //     margin-bottom: 6.4rem;
    //     max-width: 24rem;
    //     width: 100%;
    //
    //     @include r(600) {
    //         width: auto;
    //     }
    // }

    // .findFriends {
    //     margin: 0 auto 6.4rem;
    //     max-width: 960px;
    //     text-align: left;
    //
    //     .subtext {
    //         margin: 0 0 2.4rem;
    //         max-width: 60rem;
    //     }
    //
    //     h2 {
    //         margin-top: 6.4rem;
    //     }
    //
    //     .btnContainer {
    //         display: flex;
    //
    //         button {
    //             flex-grow: 0;
    //             margin-right: .8rem;
    //         }
    //     }
    // }

    // .flexContainer {
    //     align-items: center;
    //     display: flex;
    //     justify-content: space-between;
    //     margin: 0 auto 3.2rem;
    //     max-width: 960px;
    //
    //     .secondary {
    //         flex-grow: 0;
    //     }
    // }

    // .activityCard {
    //     background-color: $white;
    //     border-radius: 12px;
    //     box-shadow: rgba(7, 69, 76, 0.18) 0 11px 28px -8px;
    //     display: flex;
    //     margin: 0 -.8rem 3.2rem;
    //     padding: 1.6rem;
    //     text-align: left;
    //
    //     @include r(374) {
    //         margin: 0 .8rem 3.2rem;
    //         padding: 1.6rem 2.4rem;
    //     }
    //
    //     @include r(600) {
    //         margin: 0 auto 3.2rem;
    //         max-width: 64rem;
    //         padding: 2.4rem;
    //
    //         &.demo {
    //             max-width: 48rem;
    //         }
    //     }
    //
    //     a {
    //         text-decoration: none;
    //
    //         &:hover {
    //             color: $darkestGreen;
    //         }
    //     }
    //
    //     .bold {
    //         font-weight: bold;
    //     }
    // }

    // .email,
    // .date {
    //     font-size: 1.4rem;
    //     opacity: .8;
    // }

    // .avatar {
    //     $avatarDiameter: 6.4rem;
    //     border-radius: 50%;
    //     flex-shrink: 0;
    //     height: $avatarDiameter;
    //     margin-right: 1.6rem;
    //     overflow: hidden;
    //     width: $avatarDiameter;
    //
    //     img {
    //         width: 100%;
    //         height: 100%;
    //     }
    // }

    // .info button {
    //     margin-top: 1.6rem;
    // }

</style>
