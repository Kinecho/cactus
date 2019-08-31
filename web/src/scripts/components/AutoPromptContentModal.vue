import {QueryParam} from '@shared/util/queryParams'
<template>
    <modal :show="showContent"
            v-on:close="showContent = false"
            :showCloseButton="true"
            :closeStyles="{top: '2.4rem'}"
    >
        <PromptContent slot="body"
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
    import PromptContent from "@components/PromptContent.vue";

    export default Vue.extend({

        components: {
            Modal,
            PromptContent,
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
                    console.log("adding prompt content entry id query param");
                    updateQueryParam(QueryParam.PROMPT_CONTENT_ENTRY_ID, this.entryId);
                } else {
                    console.log("removing prompt content entry id");
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
