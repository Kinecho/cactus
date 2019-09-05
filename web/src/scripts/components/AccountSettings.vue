<template>
    <div class="accountContainer">
        <NavBar :isSticky="false"/>
        <div class="centered content">
            <h1>{{copy.common.ACCOUNT}}</h1>
            <div class="loading" v-if="loading">
                <Spinner :message="`${copy.common.LOADING}...`" :delay="1200"/>
            </div>
            <div v-if="error" class="alert error">
                {{error}}
            </div>

            <transition name="fade-in" appear>
                <div v-if="member" class="member-container">
                    <div class="item" v-if="memberSince">
                        <label class="label">
                            {{copy.auth.MEMBER_SINCE}}
                        </label>
                        <span class="value">{{ memberSince }}</span>
                    </div>

                    <div class="item">
                        <label class="label">
                            {{copy.common.EMAIL}}
                        </label>
                        <span class="value">{{member.email}}</span>
                    </div>

                    <div class="item" v-if="displayName">
                        <label class="label">
                            {{copy.auth.DISPLAY_NAME}}
                        </label>
                        <span class="value">{{displayName}}</span>
                    </div>

                    <div class="item">
                        <label class="label">
                            {{copy.common.TIME_ZONE}}
                        </label>
                        <timezone-picker @change="tzSelected" v-bind:value="member.timeZone"/>
                    </div>

                    <div class="item">
                        <label class="label">
                            {{copy.common.NOTIFICATIONS}}
                        </label>
                        <CheckBox label="Email" @change="saveEmailStatus" v-model="member.notificationSettings.email" :true-value="notificationValues.TRUE" :false-value="notificationValues.FALSE"/>
                        <!--                        <CheckBox label="Push" @change="save" v-model="member.notificationSettings.push" :true-value="notificationValues.TRUE" :false-value="notificationValues.FALSE"/>-->
                    </div>
                    <div class="item" v-if="showProviders">
                        <label class="label">{{copy.auth.CONNECTED_ACCOUNTS}}</label>
                        <ul class="providers">
                            <li v-for="provider of providers" class="provider-info" @click="removeProvider(provider.providerId)" :key="provider.providerId">
                                <provider-icon :providerId="provider.providerId" class="icon"/>
                                <div class="space-between">
                                    <span class="provider-name">{{provider.displayName}}</span>
                                    <span class="remove">{{copy.common.REMOVE}}</span>
                                </div>
                            </li>
                        </ul>

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
    import {PageRoute} from '@web/PageRoutes'
    import {FirebaseUser} from '@web/firebase'
    import {getProviderDisplayName} from "@shared/util/StringUtil"
    import ProviderIcon from "@components/ProviderIcon.vue";
    import CopyService from "@shared/copy/CopyService";
    import {LocalizedCopy} from '@shared/copy/CopyTypes'

    const copy = CopyService.getSharedInstance().copy;

    export interface Provider {
        iconName: string,
        displayName: string,
        providerId: string
    }

    export default Vue.extend({
        components: {
            NavBar,
            Footer,
            Spinner,
            CheckBox,
            TimezonePicker,
            ProviderIcon,
        },
        created() {
            this.memberUnsubscriber = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: ({member, user}) => {
                    this.member = member;
                    this.user = user;
                    this.authLoaded = true;

                    if (!member) {
                        window.location.href = PageRoute.HOME;
                    }
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
            user: FirebaseUser | undefined | null,
            memberUnsubscriber: ListenerUnsubscriber | undefined,
            error: string | undefined,
            removedProviderIds: string[],
            copy: LocalizedCopy,
            notificationValues: {
                TRUE: NotificationStatus,
                FALSE: NotificationStatus,
            }
        } {
            return {
                authLoaded: false,
                member: undefined,
                user: undefined,
                memberUnsubscriber: undefined,
                error: undefined,
                removedProviderIds: [],
                copy,
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

            providers(): Provider[] {
                let providerData = this.user && this.user.providerData;

                if (!providerData || providerData.length === 0) {
                    return [];
                }


                let info = providerData.filter(provider => provider &&
                    provider.providerId !== "password" &&
                    !this.removedProviderIds.includes(provider.providerId)).map(provider => {
                    if (provider == null) {
                        return null;
                    }
                    return {
                        providerId: provider.providerId,
                        displayName: getProviderDisplayName(provider.providerId),
                    }
                });

                return info as Provider[];
            },
            showProviders(): boolean {
                const user = this.user;
                if (!user) {
                    return false;
                }

                // return true;

                return user.providerData.filter(provider => provider &&
                    provider.providerId !== "password" &&
                    !this.removedProviderIds.includes(provider.providerId)).length > 0;
            }
        },
        methods: {
            async removeProvider(providerId: string): Promise<void> {
                if (!this.user) {
                    return;
                }
                const c = confirm(`Are you sure you want to remove ${getProviderDisplayName(providerId)}?`);
                if (c) {
                    this.removedProviderIds.push(providerId);
                    await this.user.unlink(providerId);
                    this.user.reload();
                }
                return;
            },
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
                    const result = await updateSubscriptionStatus(status, this.member.email);
                    if (!result.success) {
                        console.log("Unsetting notification status change since the update failed");

                        let errorMessage = "Oops, we're unable to save your email notification settings right now. Please try again later.";

                        if (result.error && result.error.title === "Member In Compliance State") {
                            errorMessage = "Cactus is unable to subscribe you to receive email notifications because you  previously unsubscribed. Please email help@cactus.app to resolve this issue."
                        }

                        this.member.notificationSettings.email = status === NotificationStatus.ACTIVE ? NotificationStatus.INACTIVE : NotificationStatus.ACTIVE;
                        this.error = errorMessage;
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
    @import "forms";

    .accountContainer {
        display: flex;
        flex-flow: column nowrap;
        min-height: 100vh;
        justify-content: space-between;

        header, .centered {
            width: 100%;
        }

        footer {
            flex-shrink: 0;
        }
    }

    .centered.content {
        flex-grow: 1;
        max-width: 70rem;
        padding: 2.4rem;
        text-align: left;
    }

    h1 {
        margin-bottom: 3.2rem;
    }

    .item {
        margin-bottom: 2.4rem;
    }

    .label {
        display: block;
        font-size: 1.4rem;
        margin-bottom: .8rem;
    }

    .providers {
        padding: 0;
        margin: 0 -1rem;

        li {
            list-style: none;
            padding: 1rem 1rem;
        }

        .provider-info {
            display: flex;

            &:hover {
                background-color: $lightBlue;
                cursor: pointer;
            }

            .icon {
                margin-right: 1rem;
            }

            .space-between {
                display: flex;
                flex-grow: 1;
                justify-content: space-between;
                align-items: center;
            }

            .remove {
                font-size: 1.2rem;
                letter-spacing: 1px;
                text-transform: uppercase;
                color: $darkestPink;
                @include r(768) {
                    font-size: 1.4rem;
                }
            }
        }
    }

</style>
