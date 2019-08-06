import {NotificationStatus} from '@shared/models/CactusMember'
import {NotificationStatus} from '@shared/models/CactusMember'
import {NotificationStatus} from '@shared/models/CactusMember'
<template>
    <div>
        <NavBar/>
        <div class="container">
            <h1>Account</h1>
            <div class="loading" v-if="loading">
                <Spinner message="Loading"/>
            </div>
            <div v-if="error" class="alert error">
                {{error}}
            </div>


            <transition name="fade-in" appear>
                <div v-if="member" class="member-container">
                    <div class="item">
                        <label class="label">
                            Member Since
                        </label>
                        <span class="value">{{ memberSince }}</span>
                    </div>


                    <div class="item">
                        <label class="label">
                            Email
                        </label>
                        <span class="value">{{member.email}}</span>
                    </div>
                    <div class="item">
                        <label class="label">
                            Display Name
                        </label>
                        <span class="value">{{displayName}}</span>
                    </div>
                    <div class="item">
                        <label class="label">
                            Time Zone
                        </label>
                        <timezone-picker @change="tzSelected" v-bind:value="member.timeZone"/>
                    </div>

                    <div class="item">
                        <label class="label">
                            Notifications
                        </label>
                        <CheckBox label="Email" @change="saveEmailStatus" v-model="member.notificationSettings.email" :true-value="notificationValues.TRUE" :false-value="notificationValues.FALSE"/>
                        <!--                        <CheckBox label="Push" @change="save" v-model="member.notificationSettings.push" :true-value="notificationValues.TRUE" :false-value="notificationValues.FALSE"/>-->
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
    import TimezonePicker from "@components/TimezonePicker.vue"
    import {ZoneInfo} from '@web/timezones'
    import {updateSubscriptionStatus} from '@web/mailchimp'

    export default Vue.extend({
        components: {
            NavBar,
            Footer,
            Spinner,
            CheckBox,
            TimezonePicker,
        },
        created() {
            this.memberUnsubscriber = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: ({member}) => {
                    this.member = member;
                    this.authLoaded = true;
                }
            })
        },
        destroyed() {
            if (this.memberUnsubscriber) {
                this.memberUnsubscriber();
            }
        },
        data(): {
            authLoaded: boolean,
            member: CactusMember | undefined | null,
            memberUnsubscriber: ListenerUnsubscriber | undefined,
            error: string | undefined,
            notificationValues: {
                TRUE: NotificationStatus,
                FALSE: NotificationStatus,
            }
        } {
            return {
                authLoaded: false,
                member: undefined,
                memberUnsubscriber: undefined,
                error: undefined,
                notificationValues: {
                    TRUE: NotificationStatus.ACTIVE,
                    FALSE: NotificationStatus.INACTIVE,
                }
            }
        },
        computed: {
            loading(): boolean {
                return !this.authLoaded;
            },
            memberSince(): string | undefined {
                return this.member ? formatDate(this.member.signupConfirmedAt, 'LLLL dd, yyyy') : undefined;
            },
            displayName(): string {
                return this.member ? `${this.member.firstName || ""} ${this.member.lastName || ""}`.trim() : '';
            },
        },
        methods: {
            async save() {
                if (this.member) {
                    await CactusMemberService.sharedInstance.save(this.member);
                    console.log("Save success");
                }
            },
            async saveEmailStatus(status: NotificationStatus) {
                console.log("Saving status...", status);
                this.error = undefined;
                if (this.member && this.member.email) {
                    const result = await updateSubscriptionStatus(status, this.member.email)
                    if (!result.success) {
                        console.log("Unsetting notification status change since the update failed");
                        this.member.notificationSettings.email = status === NotificationStatus.ACTIVE ? NotificationStatus.INACTIVE : NotificationStatus.ACTIVE;
                        this.error = "Oops, we were unable to save your email notification settings right now. Please try again later";
                    }
                }
            },
            async tzSelected(value: ZoneInfo | null | undefined) {
                if (this.member) {
                    this.member.timeZone = value ? value.zoneName : null;
                    await this.save();
                }
            }
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

        .loading {
            padding: 0 4rem;
        }

        .member-container {

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

        }

        hr {
            margin: 2rem 0;
        }
    }

</style>