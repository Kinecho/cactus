<template>
    <div>
        <NavBar/>
        <div class="container">
            <h1>Invite Friends</h1>
            <div class="loading" v-if="loading">
                <Spinner message="Loading"/>
            </div>
            <div v-if="error" class="alert error">
                {{error}}
            </div>


            <transition name="fade-in" appear>
                <div v-if="member" class="member-container">
                    <br><br>
                    <div class="item">
                        <label class="label">
                            Share your invite link:
                        </label>
                        <div class="referral-link">
                            <input type="text" class="referral-link" name="referral-link" :value="referralLink">
                            <span class="copy" v-clipboard:copy="referralLink"
                                               v-clipboard:success="handleCopySuccess"
                                               v-clipboard:error="handleCopyError">
                                <span v-if="copySucceeded === true">Copied</span>
                                <span v-if="copySucceeded === false">Copy</span>
                            </span>
                        </div>
                    </div>
                    <div class="item">
                        <social-sharing :url="referralLink"
                                        title="I'm inviting you to Cactus"
                                        description="See yourself and the world more positively."
                                        quote="Cactus gives you a moment of mindfulness each day by asking you questions designed to help you better understand yourself."
                                        twitter-user="itscalledcactus"
                                        inline-template>
                          <div class="sharing">
                              <network network="email">
                                <font-awesome-icon icon="envelope" size="lg" /> Email
                              </network>
                              <network network="twitter">
                                <font-awesome-icon :icon="['fab', 'twitter']" size="lg" /> Twitter
                              </network>
                              <network network="facebook">
                                <font-awesome-icon :icon="['fab', 'facebook']" size="lg" /> Facebook
                              </network>
                           </div>
                        </social-sharing>
                    </div>
                </div>
            </transition>
            <div>

            </div>
        </div>
        <Footer/>
    </div>

</template>

<script lang="ts">
    import Vue from "vue";
    import NavBar from "@components/NavBar.vue";
    import Footer from "@components/StardardFooter.vue";
    import Spinner from "@components/Spinner.vue";
    import CactusMember, {NotificationStatus} from "@shared/models/CactusMember";
    import CheckBox from "@components/CheckBox.vue";
    import CactusMemberService from '@web/services/CactusMemberService';
    import {ListenerUnsubscriber} from '@web/services/FirestoreService';
    import {formatDate} from '@shared/util/DateUtil';
    import {updateSubscriptionStatus} from '@web/mailchimp';
    import {PageRoute} from '@web/PageRoutes';

    export default Vue.extend({
        components: {
            NavBar,
            Footer,
            Spinner
        },
        created() {
            this.memberUnsubscriber = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: ({member}) => {
                    this.member = member;
                    this.authLoaded = true;

                    if (!member) {
                        window.location.href = PageRoute.HOME;
                    }
                }
            })
        },
        data(): {
            authLoaded: boolean,
            copySucceeded: boolean,
            member: CactusMember | undefined | null,
            memberUnsubscriber: ListenerUnsubscriber | undefined, 
            error: string | undefined
        } {
            return {
                authLoaded: false,
                copySucceeded: false,
                member: undefined,
                memberUnsubscriber: undefined,
                error: undefined
            }
        },
        methods: {
            handleCopyError() {
              alert("Copied Failed");
            },
            handleCopySuccess() {
              this.copySucceeded = true;
              setTimeout(() => this.copySucceeded = false, 2000);
            }
        },
        computed: {
            loading(): boolean {
                return !this.authLoaded;
            },
            referralLink(): string | undefined {
                return this.member ? "https://cactus.app?ref=" + this.member.email : undefined;
            },
            displayName(): string {
                return this.member ? `${this.member.firstName || ""} ${this.member.lastName || ""}`.trim() : '';
            },
        }
    })
</script>

<style lang="scss">
    @import "common";
    @import "mixins";
    @import "variables";


    .container {
        padding: 1rem;
        max-width: 90rem;
        margin: 0 auto;
        min-height: 600px;

        .loading {
            padding: 0 4rem;
        }

        .item {
            display: flex;
            flex-direction: column;
            margin-bottom: 2rem;
            max-width: 50rem;


            .label {
                font-weight: bold;
                font-size: 1.5rem;
                color: $darkText;
            }

            .value {
                font-size: 1.8rem;
                color: $darkText;


            }

            &.muted {
                color: $lightText
            }

            .referral-link {
                position: relative;
                display: block;
                border: 1px solid #ccc;
                padding: 10px;
                font-size: 1.8rem;
                color: $lightText;

                input {
                  padding: 10px; 
                  width: 100%;
                  float: left; 
                  border: none;
                  padding: 0;
                }

                .copy {
                    cursor: pointer;
                    display: inline-block;
                    position: absolute;
                    right: 1rem;
                    top: .9rem;
                    color: $darkGreen;
                    background: $white;
                }
                
            }

            .sharing {
                span {
                    margin-right: 30px;
                    cursor: pointer;
                }
            }

        }

        hr {
            margin: 2rem 0;
        }
    }

</style>