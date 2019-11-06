<template xmlns:v-clipboard="http://www.w3.org/1999/xhtml">
    <div class="socialHome">
        <NavBar/>
        <div class="centered">
            <div class="contentContainer">

                <!-- if brand new -->
                <transition name="fade-in" mode="out-in">
                    <div class="brandNew" v-if="currentChild == 'welcome'">
                        <h1>Reflect with Friends</h1>
                        <p class="subtext">Connect and see when you reflect on the same prompt. Easily share, discuss, and grow&nbsp;<i>together</i>.</p>
                        <button class="getStarted" @click.prevent="setVisible('findFriends')">Get Started</button>
                    </div>

                    <SocialFindFriends v-if="currentChild == 'findFriends'"/>

                    <!-- if has friends -->
                    <div class="" v-if="currentChild == 'friendActivity'">
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

                <!-- end -->
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
    import SocialFindFriends from "@components/SocialFindFriends.vue"

    export default Vue.extend({
        components: {
            NavBar,
            Footer,
            SocialFindFriends
        },
        created() {
            this.currentChild = 'findFriends';
        },
        data(): {
            currentChild: string | undefined
        } {
            return {
                currentChild: undefined
            }
        },
        methods: {
            setVisible(child: string) {
                this.currentChild = child;
            }
        },
        computed: {
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
            @include h(960) {
                height: 100vh;
            }
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
        width: 100%;
    }

    .contentContainer {
        max-width: 1200px;
        padding: 3.2rem 1.6rem;

        @include r(600) {
            padding: 6.4rem 2.4rem;
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

    .info button {
        margin-top: 1.6rem;
    }

</style>
