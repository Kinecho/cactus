<template>
    <div class="accountContainer">
        <div class="centered content">
            <h1>{{copy.common.ACCOUNT}}</h1>
            <div v-if="error" class="alert error">
                {{error}}
            </div>

            <transition name="fade-in" appear>
                <div v-if="member" class="member-container">
                    <div class="settings-group profile">
                        <h2>Personal Info</h2>
                        <div class="item" v-if="memberSince">
                            <label class="label">
                                {{copy.auth.MEMBER_SINCE}}
                            </label>
                            <span class="value">{{ memberSince }}</span>
                        </div>

                        <div class="item">
                            <label for="account_fname" class="label">
                                {{copy.common.FIRST_NAME}}
                            </label>
                            <input v-model="member.firstName" @keyup="changesToSave = true" type="text" name="fname" id="account_fname">
                        </div>

                        <div class="item">
                            <label for="account_lname" class="label">
                                {{copy.common.LAST_NAME}}
                            </label>
                            <input v-model="member.lastName" @keyup="changesToSave = true" type="text" name="lname" id="account_lname">
                        </div>

                        <div class="item">
                            <label class="label">
                                {{copy.common.EMAIL_ADDRESS}}
                            </label>
                            <p class="value">{{member.email}}</p>
                        </div>
                    </div>

                    <div class="settings-group subscription">
                        <h2>{{copy.common.SUBSCRIPTION}}</h2>
                        <upgrade :tabs-on-mobile="false" :learnMoreLinks="true" v-if="!hasActiveSubscription"/>
                        <manage-subscription v-if="hasActiveSubscription" :member="member" @error="addSnackbar"/>
                    </div>

                    <div class="settings-group notifications">
                        <h2>{{copy.common.NOTIFICATIONS}}</h2>
                        <div class="item">
                            <CheckBox :label="copy.account.EMAIL_NOTIFICATION_CHECKBOX_LABEL" @change="saveEmailStatus" v-model="member.notificationSettings.email" :true-value="notificationValues.TRUE" :false-value="notificationValues.FALSE"/>
                        </div>

                        <div class="item" v-if="promptSendTime">
                            <label class="label">
                                {{copy.account.PREFERRED_NOTIFICATION_TIME}}
                            </label>
                            <time-picker @change="timeSelected" :hour="promptSendTime.hour || 0" :minute="promptSendTime.minute || 0"/>
                        </div>

                        <div class="item">
                            <label class="label">
                                {{copy.common.TIME_ZONE}}
                            </label>
                            <div class="tz-alert" v-if="differentTimezone && !tzAlertDismissed">
                                <p>
                                    {{copy.account.SELECTED_TIMEZONE_DIFFERS_FROM_DEVICE}}
                                    {{copy.account.UPDATE_TIMEZONE_TO}} <b>{{deviceTimezoneName}}</b>?
                                </p>
                                <div class="tz-actions">
                                    <button class="button small" @click="setToDeviceZone">
                                        {{copy.account.CONFIRM_UPDATE_TIMEZONE}}
                                    </button>
                                    <button class="button small secondary" @click="tzAlertDismissed = true">
                                        {{copy.account.CANCEL_UPDATE_TIMEZONE}}
                                    </button>
                                </div>
                            </div>
                            <timezone-picker @change="tzSelected" v-bind:value="member.timeZone" v-if="member.timeZone"/>
                        </div>
                    </div>

                    <div class="settings-group profile" v-if="providers.length > 0">
                        <h2>{{copy.auth.CONNECTED_ACCOUNTS}}</h2>
                        <div class="item" v-if="showProviders">
                            <div v-for="provider of providers" class="provider-info" @click="removeProvider(provider.providerId)" :key="provider.providerId">
                                <provider-icon :providerId="provider.providerId" class="provider-icon"/>
                                <span class="provider-name">{{provider.displayName}}</span>
                                <button class="red tertiary remove">
                                    <img src="/assets/images/trash.svg" alt=""/>
                                    {{copy.common.REMOVE}}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="settings-group" v-if="showExportData">
                        <h2>Download Data<span class="badge-label">Plus</span></h2>
                        <p class="subtext">You can export and download your data from Cactus, including all your journal
                            prompts and written reflections. Tap the <strong>Download</strong> button below to create an
                            archive to keep for your records or use the data in another service.
                        <div class="item">
                            <DataExport :member="member"/>
                        </div>
                    </div>

                    <div class="settings-group delete">
                        <div class="item">
                            <button class="red tertiary remove" @click="deleteAccountModalVisible = true">
                                <img src="/assets/images/trash.svg" alt=""/>
                                {{copy.account.DELETE_ACCOUNT}}
                            </button>
                        </div>
                    </div>

                    <div class="stickyButtons" v-if="changesToSave === true">
                        <button @click="save">Save Changes</button>
                        <button @click="reloadPage" class="secondary">Cancel</button>
                    </div>

                </div>
            </transition>
            <delete-account-modal
                    :showModal="deleteAccountModalVisible"
                    @close="deleteAccountModalVisible = false"/>
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
    import Footer from "@components/StandardFooter.vue";
    import Spinner from "@components/Spinner.vue";
    import CactusMember, {
        DEFAULT_PROMPT_SEND_TIME,
        NotificationStatus,
        PromptSendTime
    } from "@shared/models/CactusMember";
    import CheckBox from "@components/CheckBox.vue";
    import CactusMemberService from '@web/services/CactusMemberService';
    import { formatDate } from '@shared/util/DateUtil';
    import TimezonePicker from "@components/TimezonePicker.vue"
    import { findByZoneName, ZoneInfo } from '@shared/timezones'
    import { updateSubscriptionStatus } from '@web/mailchimp'
    import { PageRoute } from '@shared/PageRoutes'
    import { FirebaseUser } from '@web/firebase'
    import { getProviderDisplayName } from "@shared/util/StringUtil"
    import ProviderIcon from "@components/ProviderIcon.vue";
    import CopyService from "@shared/copy/CopyService";
    import DeleteAccountModal from "@components/DeleteAccountModal.vue";
    import { LocalizedCopy } from '@shared/copy/CopyTypes'
    import SnackbarContent from "@components/SnackbarContent.vue";
    import TimePicker from "@components/TimePicker.vue"
    import * as uuid from "uuid/v4";
    import { getDeviceLocale, getDeviceTimeZone } from '@web/DeviceUtil'
    import Logger from "@shared/Logger";
    import PremiumPricing from "@components/PremiumPricing.vue";
    import ManageActiveSubscription from "@components/ManageActiveSubscription.vue";
    import { getQueryParam, removeQueryParam } from "@web/util";
    import { QueryParam } from "@shared/util/queryParams";
    import DataExport from "@components/DataExport.vue";
    import AppSettings from "@shared/models/AppSettings";
    import AppSettingsService from "@web/services/AppSettingsService";
    import { isSnackbarMessageData, SnackbarMessage } from "@components/SnackbarContentTypes";
    import Component from "vue-class-component";
    import { isString } from "@shared/util/ObjectUtil";
    import { Prop } from "vue-property-decorator";

    const logger = new Logger("AccountSettings.vue");
    const copy = CopyService.getSharedInstance().copy;

    export interface Provider {
        iconName: string,
        displayName: string,
        providerId: string
    }

    @Component({
        components: {
            Footer,
            Spinner,
            CheckBox,
            DataExport,
            TimezonePicker,
            ProviderIcon,
            SnackbarContent,
            TimePicker,
            Upgrade: PremiumPricing,
            ManageSubscription: ManageActiveSubscription,
            DeleteAccountModal,
        }
    })
    export default class AccountSettings extends Vue {

        @Prop({ type: Object as () => CactusMember, required: true })
        member!: CactusMember;

        @Prop({ type: Object as () => FirebaseUser | null, required: false, default: null })
        user!: FirebaseUser | null;

        @Prop({
            type: Object as () => AppSettings,
            required: false,
            default: AppSettingsService.sharedInstance.currentSettings
        })
        settings!: AppSettings | null;

        error: string | null = null;
        removedProviderIds: string[] = [];
        copy: LocalizedCopy = copy;
        snackbars: SnackbarMessage[] = [];
        notificationValues = {
            TRUE: NotificationStatus.ACTIVE,
            FALSE: NotificationStatus.INACTIVE,
        };
        changesToSave = false;
        deviceTimezone: string | undefined = getDeviceTimeZone();
        deviceLocale: string | undefined = getDeviceLocale();
        tzAlertDismissed = false;
        upgradeRoute: string | PageRoute = PageRoute.PRICING;
        deleteAccountModalVisible = false;

        mounted(): void {
            const message = getQueryParam(QueryParam.MESSAGE);
            if (message) {
                this.addSnackbar({ message, timeoutMs: 10000, closeable: true });
                removeQueryParam(QueryParam.MESSAGE);
            }
        }


        get showExportData(): boolean {
            const tier = this.member?.tier;
            if (!tier) {
                return false
            }
            return this.settings?.dataExportEnabledTiers.includes(tier) ?? false
        }

        get hasActiveSubscription(): boolean {
            return this.member?.hasActiveSubscription ?? false;
        }

        get promptSendTime(): PromptSendTime {
            return this.member?.promptSendTime ||
            this.member?.getLocalPromptSendTimeFromUTC() ||
            DEFAULT_PROMPT_SEND_TIME;
        }

        get memberSince(): string | undefined {
            return this.member ? formatDate(this.member.signupConfirmedAt, 'LLLL dd, yyyy') : undefined;
        }

        get displayName(): string {
            return this.member ? this.member.getFullName() : '';
        }

        get differentTimezone(): boolean {
            if (this.member?.timeZone) {
                const d = new Date();
                const localeTimeParts = d.toLocaleTimeString('en-us', { timeZoneName: 'short' }).split(' ');
                const memberTimeParts = d.toLocaleTimeString('en-us', {
                    timeZoneName: 'short',
                    timeZone: this.member.timeZone
                }).split(' ');

                return localeTimeParts[0] !== memberTimeParts[0] || localeTimeParts[1] !== memberTimeParts[1];
            }

            return !!(this.deviceTimezone && this.member?.timeZone && this.deviceTimezone !== this.member?.timeZone);
        }

        get deviceTimezoneName(): string | undefined {
            if (this.deviceTimezone) {
                const zoneInfo = findByZoneName(this.deviceTimezone);
                if (zoneInfo) {
                    return zoneInfo.displayName;
                } else {
                    const locale = this.deviceLocale;
                    return new Date().toLocaleTimeString(locale, { timeZoneName: 'long' }).split(' ')[2];
                }
            }
            return;
        }

        get providers(): Provider[] {
            let providerData = this.user?.providerData;

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
        }

        get showProviders(): boolean {
            const user = this.user;
            if (!user) {
                return false;
            }

            return user.providerData.filter(provider => provider &&
            provider.providerId !== "password" &&
            !this.removedProviderIds.includes(provider.providerId)).length > 0;
        }


        async removeProvider(providerId: string): Promise<void> {
            if (!this.user) {
                return;
            }
            const c = confirm(`Are you sure you want to remove ${ getProviderDisplayName(providerId) }?`);
            if (c) {
                this.removedProviderIds.push(providerId);
                await this.user.unlink(providerId);
                this.addSnackbar(`${ getProviderDisplayName(providerId) } Removed`);
                this.user.reload();
            }
            return;
        }

        beforeLeave(el: any) {
            const { marginLeft, marginTop, width, height } = window.getComputedStyle(el);
            el.style.left = `${ el.offsetLeft - parseFloat(marginLeft as string) }px`;
            // el.style.top = `${el.offsetTop - parseFloat(marginTop as string)}px`;
            el.style.top = `${ el.offsetTop }px`;
            el.style.width = width;
            el.style.height = height;
        }

        addSnackbar(message: SnackbarMessage): string {
            const id = uuid();
            if (typeof message === "string") {
                this.snackbars.push({ id, message: message, autoHide: true });
            } else {
                this.snackbars.push({ id, autoHide: true, closeable: true, ...message });
            }

            return id;
        }

        removeSnackbar(id: string) {
            logger.log("removing snackbar", id);
            this.snackbars = this.snackbars.filter(snack => {
                if (isSnackbarMessageData(snack)) {
                    return snack.id !== id
                }
                return false;
            });
        }

        updateSnackbar(id: string, message: SnackbarMessage) {
            const snackbar = this.snackbars.find(snack => {
                if (isSnackbarMessageData(snack)) {
                    return snack.id === id
                }
                return false;
            });

            if (!snackbar || !isSnackbarMessageData(snackbar)) {
                logger.log("no snackbar found with id");
                return;
            }
            logger.log("Found snackbar ", id);
            if (isString(message)) {
                snackbar.message = message;
            } else {
                Object.assign(snackbar, message);
            }
        }

        async save() {
            if (this.member) {
                await CactusMemberService.sharedInstance.save(this.member);
                logger.log("Save success");
                this.addSnackbar({ message: "Changes Saved", color: "success" });
                this.changesToSave = false;
            }
        }

        async saveEmailStatus(status: NotificationStatus) {
            const snackId = this.addSnackbar({
                message: "Saving notification settings...",
                closeable: false,
                autoHide: false,
                color: "info",
            });
            logger.log("Saving status...", status);
            this.error = null;
            if (this.member && this.member.email) {
                const result = await updateSubscriptionStatus(status, this.member.email);
                if (!result.success) {
                    this.addSnackbar("Oops! Unable to save email settings.");
                    logger.log("Unsetting notification status change since the update failed");

                    let errorMessage = "Oops, we're unable to save your email notification settings right now. Please try again later.";

                    if (result.error && result.error.title === "Member In Compliance State") {
                        errorMessage = "Cactus is unable to subscribe you to receive email notifications because you previously unsubscribed. Please email help@cactus.app to resolve this issue."
                    }

                    this.member.notificationSettings.email = status === NotificationStatus.ACTIVE ? NotificationStatus.INACTIVE : NotificationStatus.ACTIVE;
                    this.error = errorMessage;
                    this.removeSnackbar(snackId)
                } else {
                    this.updateSnackbar(snackId, {
                        message: "Email Settings Updated",
                        autoHide: true,
                        closeable: true,
                        color: "success",
                    });
                }
            }
        }

        async setToDeviceZone() {
            if (this.member) {
                this.member.timeZone = this.deviceTimezone;
                await this.save();
            }
        }

        async tzSelected(value: ZoneInfo | null | undefined) {
            if (this.member) {
                this.member.timeZone = value ? value.zoneName : null;
                this.changesToSave = true;
            }
        }

        async timeSelected(value: PromptSendTime) {
            if (this.member) {
                this.member.promptSendTime = value;
                // this.$set(this.member, this.member);

                this.changesToSave = true
            }
        }

        reloadPage() {
            window.location.reload();
        }

    }
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";
    @import "forms";

    .accountContainer {
        display: flex;
        flex-flow: column nowrap;
        min-height: 100vh;
        justify-content: space-between;
        overflow: hidden;

        header, .centered {
            width: 100%;
        }
    }

    .centered.content {
        flex-grow: 1;
        max-width: 80rem;
        padding: 6.4rem 2.4rem;
        text-align: left;
    }

    h1, .item {
        margin-bottom: 3.2rem;
    }

    h2 {
        color: $mediumDolphin;
        font-size: 2.4rem;
        margin-bottom: 2.4rem;

        .badge-label {
            @include trialBadge;
            color: $white;
            vertical-align: text-bottom;
        }
    }

    .subtext {
        margin-bottom: 1.6rem;
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
        margin-bottom: 6.4rem;

        &.delete {
            border-top: $lightestGreen 1px solid;
            padding-top: 4.8rem;
        }
    }

    .subscription .centered {
        display: block;
        text-align: left;
    }

    .provider-info {
        @include accountBox;

        &:hover {
            background-color: $lightestGreen;
            cursor: pointer;
        }
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

    .tz-alert {
        background-color: lighten($yellow, 15%);
        border: 1px solid $yellow;
        border-radius: 1.2rem;
        box-shadow: 0 5px 11px -3px rgba(0, 0, 0, 0.08);
        color: $darkText;
        margin: .8rem 0 1.6rem;
        padding: 2rem 2.4rem;

        p {
            margin-bottom: 1.6rem;
        }

        button {
            margin: 0 .8rem .8rem 0;
        }
    }

    .stickyButtons {
        background-color: $white;
        bottom: 0;
        display: flex;
        justify-content: space-between;
        margin: 0 -.4rem;
        padding: 1.6rem 0;
        position: sticky;
        z-index: 1;

        @include r(600) {
            justify-content: flex-start;
        }

        button {
            flex-basis: 50%;
            margin: 0 .4rem;
            white-space: nowrap;

            @include r(600) {
                flex-basis: auto;
                flex-grow: 0;
            }
        }
    }

    .modal-wrapper {
        max-width: 60rem;
    }

</style>
