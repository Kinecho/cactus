<template>
    <div>
        <div v-if="error" class="alert error">
            <p>{{error}}</p>
        </div>
        <div v-if="successMessage" class="alert success">
            <p>{{successMessage}}</p>
            <button @click="successMessage=null">Start Over</button>
        </div>
        <button @click="showEmail = true " v-if="!showEmail"> Email me the data</button>
        <div class="email-input" v-if="showEmail && !successMessage">
            <p>What email address should we send the data to?</p>
            <label>
                Your Email Address
                <input type="email" v-model="emailAddress" placeholder="name@example.com"/>
            </label>
            <button @click="emailData">Send</button>
        </div>

        <button v-if="!downloadUrl && !showEmail" :disabled="loading" @click="startDownload">{{buttonText}}</button>
        <div v-if="downloadUrl">
            <p>Your download should begin automatically.</p>
            <p>If not, <a :href="downloadUrl" target="_blank" class="fancy">click here</a>.</p>
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
                return this.loading ? "Preparing Data..." : "Download Data"
            }
        },
        methods: {
            async startDownload() {
                this.loading = true;
                this.downloadUrl = await DownloadService.shared.getDownloadDataUrl();
                this.loading = false;
                if (this.downloadUrl) {
                    window.location.href = this.downloadUrl;
                }

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
                const result = await DownloadService.shared.emailData({ email });
                if (result.success) {
                    this.successMessage = result.message ?? "Email sent successfully. Please check your email for further instructions.";
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

    .fancy {
        @include fancyLink;
    }
</style>