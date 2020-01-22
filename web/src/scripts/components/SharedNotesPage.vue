<template>
    <div class="page-wrapper">
        <div v-if="show404">
            <FourOhFour/>
        </div>
        {{ promptContentEntryId }}
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {PageRoute} from '@shared/PageRoutes'
    import FourOhFour from "@components/404.vue"
    import PromptContent, {Content, ContentType} from '@shared/models/PromptContent'
    import {ListenerUnsubscriber} from '@web/services/FirestoreService'
    import PromptContentService from "@web/services/PromptContentService";
    import Logger from "@shared/Logger";

    const logger = new Logger("PromptContent.vue");

    export default Vue.extend({
        components: {
            FourOhFour
        },
        beforeMount(){
            if (!this.promptContentEntryId) {
                this.promptContentEntryId = window.location.pathname.split(`${PageRoute.SHARED_NOTES_ROOT}/`)[1];
                
                const flamelinkOptions = {
                    onData: async (promptContent?: PromptContent | undefined, error?: any) => {
                        if (!promptContent) {
                            this.error = "This prompt does not exist";
                            this.loading = false;
                            this.promptContent = undefined;
                            this.show404 = true;
                            return;
                        }

                        if (error) {
                            this.promptContent = undefined;
                            this.loading = false;
                            this.error = "Oops! We were unable to load the prompt. Please try again later.";
                            this.show404 = false;
                            logger.error("Failed to load prompts", error);
                            return;
                        }

                        this.promptContent = promptContent;
                        this.loading = false;
                    }
                };

                this.promptsUnsubscriber = PromptContentService.sharedInstance.observeByEntryId(this.promptContentEntryId, flamelinkOptions)
            
            } else {
                this.show404 = true;
            }
        },
        props: {

        },
        data():{
            promptContentEntryId: string | undefined,
            promptContent: PromptContent | undefined,
            loading: boolean,
            error: string | undefined,
            show404: boolean,
            promptsUnsubscriber: ListenerUnsubscriber | undefined,
        }{
            return {
                promptContentEntryId: undefined,
                promptContent: undefined,
                promptsUnsubscriber: undefined,
                show404: false,
                error: undefined,
                loading: false
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .page-wrapper {
        background-color: $white;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        position: relative;
        width: 100vw;
        min-height: 50vh;
    }

</style>
