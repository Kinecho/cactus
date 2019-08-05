<template>
    <div>
        <NavBar/>
        <div class="container">
            <h1>Account Settings</h1>
            <div class="loading" v-if="loading">
                <Spinner message="Loading"/>
            </div>
            <transition name="fade-in" appear>
                <div v-if="member">
                    <div class="item">
                        <label class="label">
                            Member ID
                        </label>
                        <span class="value">{{member.id}}</span>
                    </div>
                    <div class="item">
                        <label class="label">
                            User ID
                        </label>
                        <span class="value">{{member.userId}}</span>
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
                            Member Since
                        </label>
                        <span class="value">{{ memberSince }}</span>
                    </div>

                    <div class="item">
                        <label class="label">
                            Notifications
                        </label>
                        <CheckBox label="Email" v-model="member.notificationSettings.email" :true-value="notificationValues.TRUE" :false-value="notificationValues.FALSE"/>
                        <CheckBox label="Push" v-model="member.notificationSettings.push" :true-value="notificationValues.TRUE" :false-value="notificationValues.FALSE"/>
                    </div>

                    <div>
                        <button class="button" @click="save">Save</button>
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

    export default Vue.extend({
        components: {
            NavBar,
            Footer,
            Spinner,
            CheckBox,
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
            notificationValues: {
                TRUE: NotificationStatus,
                FALSE: NotificationStatus,
            }
        } {
            return {
                authLoaded: false,
                member: undefined,
                memberUnsubscriber: undefined,
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
                return this.member ? `${this.member.firstName} ${this.member.lastName}`.trim() : '';
            }
        },
        methods: {
            async save(){
                if (this.member){
                    await CactusMemberService.sharedInstance.save(this.member)
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

        .loading {
            padding: 0 4rem;
        }

        .item {
            display: flex;
            flex-direction: column;
            margin-bottom: 1rem;

            .label {
                font-weight: bold;
                font-size: 1.5rem;
                color: $darkText;
            }

            .value {
                font-size: 1.8rem;
                color: $darkText;
            }
        }
    }

</style>