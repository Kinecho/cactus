<template>
    <div>
        <button v-if="!downloadUrl" :disabled="loading" @click="startDownload">{{buttonText}}</button>
        <div v-if="downloadUrl">
            <p>Your download should begin automatically.</p>
            <p>If not, <a :href="downloadUrl" target="_blank" class="fancy">click here</a>.</p>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import DownloadService from "@web/services/DownloadService";

    export default Vue.extend({
        name: "DataExport",
        data(): {
            loading: boolean,
            downloadUrl: string | undefined,
        } {
            return {
                loading: false,
                downloadUrl: undefined,
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