<template>
    <div>
        <div v-if="error" class="alert error">
            <p>{{error}}</p>
        </div>
        <div v-if="successMessage" class="alert success">
            <p class="subtext">{{successMessage}}</p>
            <button @click="closeEmailForm">Close</button>
        </div>
        <button class="small secondary" v-if="!downloadUrl && !showEmail" :disabled="loading" @click="startDownload">
            {{buttonText}}
        </button>
        <div v-if="downloadUrl">
            <p class="subtext">Your download should begin automatically. If not,
                <a :href="downloadUrl" target="_blank" class="fancy">click here</a>.</p>
        </div>
        <button class="small secondary" @click="showEmail = true " v-if="!showEmail">Email Me</button>
        <div class="email-input" v-if="showEmail && !successMessage">
            <label>
                <p class="subtext">What email address should we send the file to?</p>
                <input class="emailBox" type="email" v-model="emailAddress" placeholder="name@example.com"/>
            </label>
            <div class="btnContainer">
                <button @click="emailData" :disabled="loading">Export & Send</button>
                <button class="secondary" @click="showEmail=false">Cancel</button>
            </div>
        </div>


    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import DownloadService from "@web/services/DownloadService";
    import CactusMember from "@shared/models/CactusMember";
    import { isBlank, isValidEmail } from "@shared/util/StringUtil";

    export default Vue.extend({
        name: "DataExport",
        props: {
            member: { type: Object as () => CactusMember }
        },
        data(): {
            loading: boolean,
            downloadUrl: string | undefined,
            showEmail: boolean,
            emailAddress: string,
            error: string | null,
            successMessage: string | null,
        } {
            return {
                loading: false,
                downloadUrl: undefined,
                showEmail: false,
                emailAddress: this.member?.email ?? "",
                error: null,
                successMessage: null,
            }
        },
        computed: {
            buttonText(): string {
                return this.loading ? "Preparing..." : "Export & Download"
            }
        },
        methods: {
            async startDownload() {
                this.loading = true;
                const result = await DownloadService.shared.exportData({ sendEmail: false });

                if (result.success && result.downloadUrl) {
                    this.downloadUrl = result.downloadUrl;
                    window.location.href = result.downloadUrl;
                }
                this.loading = false;
            },
            closeEmailForm() {
                this.successMessage = null;
                this.showEmail = false
            },
            async emailData() {

                const email = this.emailAddress;
                if (isBlank(email) || !isValidEmail(email)) {
                    this.error = "Please enter a valid email address";
                    this.loading = false;
                    this.successMessage = null;
                    return;
                }
                this.loading = true;
                this.error = null;
                const result = await DownloadService.shared.exportData({ email, sendEmail: true });
                if (result.success) {
                    this.successMessage = result.message ?? "Email sent! Please check your email for further instructions.";
                    this.error = null;
                } else {
                    this.successMessage = null;
                    this.error = result.message ?? "Oops, something went wrong while preparing your data. Please try again later."
                }

                this.loading = false;
            }
        }
    })
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";

    button {
        display: inline-block;
        flex-grow: 0;
        margin-right: .8rem;
    }

    .fancy {
        @include fancyLink;
    }

    .subtext {
        margin-bottom: 1.6rem;
    }

    .email-input {
        border: 1px solid $lightestGreen;
        border-radius: 1.2rem;
        padding: 1.6rem;

        @include r(600) {
            padding: 2.4rem;
        }
    }

    .emailBox {
        width: 100%;
    }

    label {
        display: block;
        margin-bottom: 1.6rem;
    }

    .btnContainer {
        align-items: center;
        display: flex;
    }
</style>
