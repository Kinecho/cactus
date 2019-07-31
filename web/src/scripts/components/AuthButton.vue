<template>
    <a :class="['no-loading', variant, {fancy: fancy, disabled: !authLoaded}]" :disabled="!authLoaded" v-bind:href="redirectUrl">{{linkText}}</a>
</template>

<script lang="ts">
    import Vue from "vue"
    import {ListenerUnsubscriber} from "@web/services/FirestoreService"
    import {FirebaseUser, getAuth} from '@web/firebase'
    import CactusMemberService from '@web/services/CactusMemberService'
    import CactusMember from "@shared/models/CactusMember"
    import {QueryParam} from '@shared/util/queryParams'


    export default Vue.extend({
        props: {
            linkText: String,
            linkUrl: String,
            fancy: Boolean,
            variant: {
                type: String,
                validator: (value:any) => {
                    return ['button', 'link'].indexOf(value) !== -1
                }
            }
        },
        created() {
            this.authUnsubscriber = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: ({user, member}) => {
                    this.user = user;
                    this.member = member;
                    this.authLoaded = true;
                }
            })
        },
        destroyed() {
          if (this.authUnsubscriber){
              console.log("Unsubscribing auth listener for AuthButton");
              this.authUnsubscriber()
          }
        },
        data(): {
            authUnsubscriber?: ListenerUnsubscriber,
            user?: FirebaseUser,
            member?: CactusMember,
            authLoaded: boolean
        } {
            return {
                authLoaded: false,
                member: undefined,
            }
        },
        computed: {
            redirectUrl():string {
                return this.member ? this.linkUrl : `/signup?${QueryParam.REDIRECT_URL}=${this.linkUrl}`
            }
        }

    })
</script>

<style scoped lang="scss">
    @import "mixins";
    @import "variables";

    .button, .link {
        display: inline-block;
        transition: all .2s;
    }

    .link {
        &.fancy {
            @include fancyLink
        }
    }



</style>