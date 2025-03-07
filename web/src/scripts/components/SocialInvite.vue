<template>
    <div class="socialInvite">
        <NavBar/>
        <div class="centered">
            <div class="contentContainer" v-if="!loading && member">
                <SocialFindFriends v-if="currentChild === 'findFriends'" :member="member"/>
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
    import { ListenerUnsubscriber } from '@web/services/FirestoreService'
    import CactusMember from "@shared/models/CactusMember"
    import CactusMemberService from "@web/services/CactusMemberService"
    import { PageRoute } from "@shared/PageRoutes"
    import { QueryParam } from '@shared/util/queryParams'
    import Logger from "@shared/Logger"
    import { pushRoute } from "@web/NavigationUtil";

    const logger = new Logger("SocialInvite");

    export default Vue.extend({
        components: {
            NavBar,
            Footer,
            SocialFindFriends,
        },
        data(): {
            currentChild: string,
            loading: boolean,
            member: CactusMember | undefined,
            memberUnsubscriber: ListenerUnsubscriber | undefined,
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
                onData: async ({ member }) => {
                    if (!member) {
                        await pushRoute(`${ PageRoute.LOGIN }?${ QueryParam.REDIRECT_URL }=${ encodeURIComponent(PageRoute.FRIENDS) }`)
                    }
                    this.member = member;
                    this.loading = false;
                }
            })
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

    .socialInvite {
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
