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
                    <div class="settings-group profile">
                        <h3>Personal Info</h3>
                        <div class="item" v-if="memberSince">
                            <label class="label">
                                {{copy.auth.MEMBER_SINCE}}
                            </label>
                            <span class="value">{{ memberSince }}</span>
                        </div>

                        <div class="item">
                            <label for="fname" class="label">
                                {{copy.common.FIRST_NAME}}
                            </label>
                            <input v-model="member.firstName" @keyup="changesToSave = true" type="text" name="fname">
                        </div>

                        <div class="item">
                            <label for="lname" class="label">
                                {{copy.common.LAST_NAME}}
                            </label>
                            <input v-model="member.lastName" @keyup="changesToSave = true;" type="text" name="lname">
                        </div>

                        <div class="item">
                            <label class="label">
                                {{copy.common.EMAIL_ADDRESS}}
                            </label>
                            <p class="value">{{member.email}}</p>
                        </div>

                        <div class="item">
                            <label class="label">
                                {{copy.common.TIME_ZONE}}
                            </label>
                            <timezone-picker @change="tzSelected" v-bind:value="member.timeZone"/>
                        </div>
                        <div class="saveCancel" v-if="changesToSave == true">
                            <button @click="save">Save Changes</button>
                            <button @click="reloadPage" class="secondary">Cancel</button>
                        </div>
                    </div>

                    <div class="settings-group notifications">
                        <h3>{{copy.common.NOTIFICATIONS}}</h3>
                        <div class="item">
                            <CheckBox label="Receive an email when a new prompt is ready" @change="saveEmailStatus" v-model="member.notificationSettings.email" :true-value="notificationValues.TRUE" :false-value="notificationValues.FALSE"/>
                        </div>
                    </div>

                    <div class="settings-group profile" v-if="providers.length > 0">
                        <h3>{{copy.auth.CONNECTED_ACCOUNTS}}</h3>
                        <div class="item" v-if="showProviders">
                            <div v-for="provider of providers" class="provider-info" @click="removeProvider(provider.providerId)" :key="provider.providerId">
                                <provider-icon :providerId="provider.providerId" class="provider-icon"/>
                                <span class="provider-name">{{provider.displayName}}</span>
                                <button class="red tertiary remove">
                                    <img src="assets/images/trash.svg" alt="" />
                                    {{copy.common.REMOVE}}
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </transition>
            <div class="snackbar-container">

                <transition-group name="snackbar" tag="div" @before-leave="beforeLeave">
                    <snackbar-content
                            class="snackbar-item"
                            v-for="(snackbar, index) of snackbars"
                            :text="snackbar.message"
                            :closeable="snackbar.closeable"
                            :key="snackbar.id"
                            @close="removeSnackbar(snackbar.id)"
                            :autoHide="snackbar.autoHide"
                            :durationMs="snackbar.timeoutMs"
                            :color="snackbar.color"
                    />
                </transition-group>
            </div>
        </div>
        <Footer/>
    </div>

</template>

<script lang="ts">
    import Vue from "vue";
    import NavBar from "@components/NavBar.vue";
    import Footer from "@components/StandardFooter.vue";
    import Spinner from "@components/Spinner.vue";
    import CactusMember, {NotificationStatus} from "@shared/models/CactusMember";
    import CheckBox from "@components/CheckBox.vue";
    import CactusMemberService from '@web/services/CactusMemberService';
    import {ListenerUnsubscriber} from '@web/services/FirestoreService';
    import {formatDate} from '@shared/util/DateUtil';
    import TimezonePicker from "@components/TimezonePicker.vue"
    import {ZoneInfo} from '@web/timezones'
    import {updateSubscriptionStatus} from '@web/mailchimp'
    import {PageRoute} from '@shared/PageRoutes'
    import {FirebaseUser} from '@web/firebase'
    import {getProviderDisplayName} from "@shared/util/StringUtil"
    import ProviderIcon from "@components/ProviderIcon.vue";
    import CopyService from "@shared/copy/CopyService";
    import {LocalizedCopy} from '@shared/copy/CopyTypes'
    import SnackbarContent from "@components/SnackbarContent.vue";
    import * as uuid from "uuid/v4";

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
            SnackbarContent,
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
            snackbars: { id: string, message: string, timeoutMs?: number, closeable?: boolean, autoHide?: boolean, color?: string }[],
            notificationValues: {
                TRUE: NotificationStatus,
                FALSE: NotificationStatus,
            },
            changesToSave: boolean
        } {
            return {
                authLoaded: false,
                member: undefined,
                user: undefined,
                memberUnsubscriber: undefined,
                error: undefined,
                removedProviderIds: [],
                copy,
                snackbars: [],
                notificationValues: {
                    TRUE: NotificationStatus.ACTIVE,
                    FALSE: NotificationStatus.INACTIVE,
                },
                changesToSave: false
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
                    this.addSnackbar(`${getProviderDisplayName(providerId)} Removed`);
                    this.user.reload();
                }
                return;
            },
            beforeLeave(el: any) {
                const {marginLeft, marginTop, width, height} = window.getComputedStyle(el);
                el.style.left = `${el.offsetLeft - parseFloat(marginLeft as string)}px`;
                // el.style.top = `${el.offsetTop - parseFloat(marginTop as string)}px`;
                el.style.top = `${el.offsetTop}px`;
                el.style.width = width
                el.style.height = height
            },
            addSnackbar(message: string | { message: string, timeoutMs?: number, closeable?: boolean, autoHide?: boolean, color?: string }): string {

                const id = uuid();
                if (typeof message === "string") {
                    this.snackbars.push({id, message: message, autoHide: true});
                } else {
                    this.snackbars.push({id, autoHide: true, closeable: true, ...message});
                }

                return id;
            },
            removeSnackbar(id: string) {
                console.log("removing snackbar", id);
                this.snackbars = this.snackbars.filter(snack => snack.id !== id);
            },
            updateSnackbar(id: string, message: string | { message: string, timeoutMs?: number, closeable?: boolean, autoHide?: boolean, color?: string }) {
                const snackbar = this.snackbars.find(snack => snack.id === id);

                if (!snackbar) {
                    console.log("no snackbar found with id");
                    return;
                }
                console.log("Found snackbar ", id);
                if (typeof message === "string") {
                    snackbar.message = message;
                } else {
                    Object.assign(snackbar, message);
                }
            },
            async save() {
                if (this.member) {
                    await CactusMemberService.sharedInstance.save(this.member);
                    console.log("Save success");
                    this.addSnackbar({message: "Changes Saved", color: "success"});
                }
            },
            async saveEmailStatus(status: NotificationStatus) {
                const snackId = this.addSnackbar({
                    message: "Saving notification settings...",
                    closeable: false,
                    autoHide: false,
                    color: "info",
                });
                console.log("Saving status...", status);
                this.error = undefined;
                if (this.member && this.member.email) {
                    const result = await updateSubscriptionStatus(status, this.member.email);
                    if (!result.success) {
                        this.addSnackbar("Oops! Unable to save email settings.");
                        console.log("Unsetting notification status change since the update failed");

                        let errorMessage = "Oops, we're unable to save your email notification settings right now. Please try again later.";

                        if (result.error && result.error.title === "Member In Compliance State") {
                            errorMessage = "Cactus is unable to subscribe you to receive email notifications because you  previously unsubscribed. Please email help@cactus.app to resolve this issue."
                        }

                        this.member.notificationSettings.email = status === NotificationStatus.ACTIVE ? NotificationStatus.INACTIVE : NotificationStatus.ACTIVE;
                        this.error = errorMessage;
                    } else {
                        this.updateSnackbar(snackId, {
                            message: "Email Settings Updated",
                            autoHide: true,
                            closeable: true,
                            color: "success",
                        });
                    }
                }
            },
            async tzSelected(value: ZoneInfo | null | undefined) {
                if (this.member) {
                    this.member.timeZone = value ? value.zoneName : null;
                    this.changesToSave = true;
                }
            },
            reloadPage() {
                window.location.reload();
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
    }

    .centered.content {
        flex-grow: 1;
        max-width: 70rem;
        padding: 6.4rem 2.4rem;
        text-align: left;
    }

    h1, .item {
        margin-bottom: 3.2rem;
    }

    h3 {
        margin-bottom: 2.4rem;
    }

    h3 {
        color: $royal;
    }

    .label {
        display: block;
        font-size: 1.6rem;
        margin-bottom: .4rem;
        opacity: .8;
    }

    .value {
        line-height: 1.5;
    }

    input {
        @include textInputAlt;
        width: 100%;
    }

    .settings-group {
        margin-bottom: 4.8rem;
    }

    .provider-info {
        align-items: center;
        background-color: lighten($lightestGreen, 9%);
        border-radius: .8rem;
        display: flex;
        padding: .4rem 1.6rem;
        width: 100%;
    }

    .provider-icon {
        margin-right: .8rem;
    }

    .provider-name {
        flex-grow: 1;
    }

    .remove {
        align-items: center;
        display: flex;
        flex-grow: 0;
        padding: 1.2rem 0;

        img {
            height: 1.6rem;
            margin-right: .6rem;
            width: 1.6rem;
        }
    }

    .snackbar-container {
        position: fixed;
        top: 1rem;
        left: 1rem;
        right: 1rem;
        z-index: 5000;
        display: flex;
        flex-direction: column;
        align-items: center;

        @include r(600) {
            bottom: unset;
            top: 9rem;
        }

        > div {
            display: flex;
            flex-direction: column;
        }
    }

    .snackbar-item {
        transition: all .3s;
        width: 30rem;
        min-width: 20rem;
        max-width: 90vw;
    }

    .snackbar-enter {
        opacity: 0;
        transform: translateY(20px);
    }

    .snackbar-leave-to {
        animation: snackbar-out .3s;
    }

    .snackbar-leave-active {
        position: absolute;
    }

    @keyframes snackbar-out {
        50% {
            opacity: 0;
        }
        100% {
            transform: translateX(-200px);
            opacity: 0;
        }
    }

</style>
