<template>
    <div>
        <div>
            <h1>{{title}}</h1>
            <p v-if="message">{{message}}</p>
        </div>
        <form class="email-form hidden" id="email-signup">
            <div class="alert error hidden">Sorry, looks like we have issues.</div>
            <input type="email" name="email" placeholder="Enter your email address" id="email-input"/>
            <button type="submit" name="submit" class="email-submit-button">Next</button>
        </form>
        <div id="third-party-loading" class="loading hidden">
            <img src="/assets/images/loading.svg" alt=""/>Signing In...
        </div>
        <div class="divider hidden">
            <p class="message-container">Or choose from one of the following:</p>
        </div>
        <div id="third-party-logins">
            <div class="buttonContainer" id="signup-app"></div>
        </div>


    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {ListenerUnsubscriber} from '@web/services/FirestoreService'
    import {User as UserRecord} from "firebase"
    import CactusMember from '@shared/models/CactusMember'
    import CactusMemberService from '@web/services/CactusMemberService'

    export default Vue.extend({
        created() {
            this.memberListener = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: (({member, user}) => {
                    this.member = member;
                    this.user = user;
                    this.authLoaded = true;
                })
            });
        },
        destroyed() {
            if (this.memberListener) {
                this.memberListener();
            }
        },
        props: {},
        data(): {
            title: string,
            message: string | undefined,
            memberListener: ListenerUnsubscriber | undefined,
            user: UserRecord | undefined,
            member: CactusMember | undefined,
            authLoaded: boolean,

        } {
            return {
                title: "Sign Up",
                message: undefined,
                user: undefined,
                member: undefined,
                authLoaded: false,
                memberListener: undefined,
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";


    h1 {
        margin: 0;
    }

    form {
        display: flex;
        flex-flow: column wrap;
        margin: 0 auto;
        max-width: 70rem;
        padding: 2.4rem 0;

        @include r(600) {
            flex-direction: row;
            padding: 2.4rem;
        }
    }

    .buttonContainer {
        margin: -1.6rem -24px 0;

        @include r(600) {
            margin: -1.6rem auto 0;
            max-width: 30rem;
        }
    }

    #yellowBlob1 {
        bottom: 3vh;
        height: auto;
        left: -180px;
        position: absolute;
        width: 360px;
    }

    #pinkBlob {
        height: auto;
        position: absolute;
        right: -90px;
        top: 24px;
        transform: rotate(-165deg);
        width: 180px;
    }

</style>
