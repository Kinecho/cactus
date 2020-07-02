<template>
    <four-oh-four v-if="notFound"/>
    <div v-else class="prompt-page">
        <h1>prompt page</h1>
        <spinner v-if="loading"/>
        <div>
            <p>EntryId: {{entryId || 'not set'}}</p>
            <p>PromptId: {{promptId || 'not set'}}</p>
            <p>Found: {{promptContent && promptContent.subjectLine}}</p>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import { Prop } from "vue-property-decorator";
    import Logger from "@shared/Logger"
    import FourOhFour from "@components/404.vue";
    import PromptContent from "@shared/models/PromptContent";
    import PromptContentService from "@web/services/PromptContentService";
    import { ListenerUnsubscriber } from "@web/services/FirestoreService";
    import Spinner from "@components/Spinner.vue";

    const logger = new Logger("PromptPage");


    @Component({
        components: {
            FourOhFour,
            Spinner,
        }
    })
    export default class PromptPage extends Vue {
        name = "PromptPage";

        @Prop({ type: String, required: false, default: null })
        entryId!: string | null;

        @Prop({ type: String, required: false, default: null })
        promptId!: string | null

        loading: boolean = false;
        notFound: boolean = false;
        promptContent: PromptContent | null = null;
        promptContentUnsubscriber: ListenerUnsubscriber | null = null;

        beforeMount() {
            logger.info("Loading page with entryId = ", this.entryId);
            if (!this.promptId && !this.entryId) {
                this.notFound = true;
            }

            this.setupPromptObserver();
        }

        destroyed() {
            this.promptContentUnsubscriber?.();
        }

        setupPromptObserver() {
            this.loading = true;

            PromptContentService.sharedInstance.observeByPromptOrEntryId({
                entryId: this.entryId,
                promptId: this.promptId
            }, {
                onData: async (promptContent?: PromptContent, error?: any) => {
                    this.loading = false;
                    if (!promptContent) {
                        this.notFound = true;
                        return
                    }
                    this.promptContent = promptContent ?? null;
                }
            });

        }
    }
</script>

<style scoped lang="scss">

</style>