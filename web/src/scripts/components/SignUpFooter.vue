<template>
    <div class="signup-footer" v-if="showFooter">
        <div id="signupAnchor"></div>
        <div class="centered">
            <section class="email">
                <h2 class="emailHeader">A Reflection a Day…</h2>
                <p class="subtext">A Different Kind of Mindfulness</p>
                <form id="email-form-bottom" class="lower">
                    <div class="alert error hidden">Sorry, looks like we have issues.</div>
                    <magic-link :buttonText="buttonText"/>
                </form>
            </section>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import MagicLink from "@components/MagicLinkInput.vue";
    import CopyService from "@shared/copy/CopyService";
    import {ListenerUnsubscriber} from '@web/services/FirestoreService'
    import CactusMemberService from '@web/services/CactusMemberService'
    import CactusMember from "@shared/models/CactusMember"

    const copy = CopyService.getSharedInstance().copy;
    export default Vue.extend({
        components: {
            MagicLink,
        },
        created() {

        },
        props: {
            buttonText: {
                type: String,
                default: copy.auth.SIGN_UP_FREE,
            }
        },
        beforeMount() {
            this.authUnsubscriber = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: ({member}) => {
                    this.member = member;
                    this.authLoaded = true;
                }
            })
        },
        data(): {
            authUnsubscriber: ListenerUnsubscriber | undefined,
            member: CactusMember | undefined,
            authLoaded: boolean,
        } {
            return {
                member: undefined,
                authUnsubscriber: undefined,
                authLoaded: false,
            }
        },
        computed: {
            showFooter(): boolean {
                return this.authLoaded && !this.member
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .signup-footer {
        background: $yellow url(assets/images/yellowNeedles.svg) 0 0/320px;
        padding: 3.2rem 2.4rem 1.6rem;
        position: relative;
        z-index: 1;

        @include r(768) {
            padding: 5.6rem 0;
        }

        input[type=email] {
            border-color: $darkYellow;

            &:hover {
                border-color: $darkestYellow;
            }
        }
    }

    .emailHeader {
        font-size: 2.4rem;
        margin: 0 0 .8rem;
        padding: 0 2.4rem;

        @include r(768) {
            font-size: 3.2rem;
        }
    }

    .subtext {
        padding: 0 2.4rem;
    }

</style>
