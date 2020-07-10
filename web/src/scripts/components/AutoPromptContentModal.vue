<template>
    <modal :show="showContent"
            v-on:close="showContent = false"
            :showCloseButton="false"
    >
        <LegacyPromptContent slot="body"
                v-bind:promptContentEntryId="entryId"
                v-bind:isModal="true"
                v-on:close="showContent = false"
        />
    </modal>
</template>

<script lang="ts">
    import Vue from "vue";
    import {QueryParam} from "@shared/util/queryParams"
    import {getQueryParam, removeQueryParam, updateQueryParam} from "@web/util"
    import Modal from "@components/Modal.vue";
    import LegacyPromptContent from "@components/LegacyPromptContent.vue";
    import Logger from "@shared/Logger";

    const logger = new Logger("AutoPromptContentModal.vue");

    export default Vue.extend({

        components: {
            Modal,
            LegacyPromptContent: LegacyPromptContent,
        },
        created() {
            const entryId = getQueryParam(QueryParam.PROMPT_CONTENT_ENTRY_ID);
            this.entryId = entryId || undefined;
            if (entryId && this.autoLoad) {
                this.showContent = true;
            }
        },
        props: {
            autoLoad: {type: Boolean, default: true}
        },
        data(): {
            showContent: boolean,
            entryId: string | undefined,
        } {
            return {
                showContent: false,
                entryId: undefined,
            }
        },
        watch: {
            showContent(show) {
                if (show && this.entryId) {
                    logger.log("adding prompt content entry id query param");
                    updateQueryParam(QueryParam.PROMPT_CONTENT_ENTRY_ID, this.entryId);
                } else {
                    logger.log("removing prompt content entry id");
                    removeQueryParam(QueryParam.PROMPT_CONTENT_ENTRY_ID);
                    removeQueryParam(QueryParam.CONTENT_INDEX);
                }
            }
        },
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

</style>
