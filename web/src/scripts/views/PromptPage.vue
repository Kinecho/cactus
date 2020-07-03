<template>
    <four-oh-four v-if="notFound"/>
    <div v-else class="prompt-page">
        <h1>prompt page</h1>
        <p>memberEmail: {{member.email}}</p>
        <transition mode="out-in" name="component-fade" appear>
            <spinner v-if="loading" :delay="1200" message="Loading"/>
            <prompt-content v-else
                    :prompt-content="promptContent"
                    :prompt="prompt"
                    :responses="responses"
                    :index="page"

                    @next="nextPage"
                    @previous="previousPage"
            />
        </transition>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import { Prop, Watch } from "vue-property-decorator";
    import Logger from "@shared/Logger"
    import FourOhFour from "@components/404.vue";
    import PromptContent from "@shared/models/PromptContent";
    import PromptContentService from "@web/services/PromptContentService";
    import { ListenerUnsubscriber } from "@web/services/FirestoreService";
    import Spinner from "@components/Spinner.vue";
    import CactusMember from "@shared/models/CactusMember";
    import ReflectionPrompt from "@shared/models/ReflectionPrompt";
    import ReflectionResponse from "@shared/models/ReflectionResponse";
    import ReflectionResponseService from "@web/services/ReflectionResponseService";
    import ReflectionPromptService from "@web/services/ReflectionPromptService";
    import PromptContentCard from "@components/promptcontent/PromptContent.vue";
    import { pushRoute } from "@web/NavigationUtil";
    import { PageRoute } from "@shared/PageRoutes";
    import { QueryParam } from "@shared/util/queryParams";

    const logger = new Logger("PromptPage");

    /**
     * The component fetches all of the data needed to render a Prompt Content page.
     */
    @Component({
        components: {
            PromptContent: PromptContentCard,
            FourOhFour,
            Spinner,
        }
    })
    export default class PromptPage extends Vue {
        name = "PromptPage";

        @Prop({ type: String, required: false, default: null })
        _entryId!: string | null;

        @Prop({ type: String, required: false, default: null })
        _promptId!: string | null

        @Prop({ type: Object as () => CactusMember, required: true })
        member!: CactusMember;

        @Prop({ type: Number, required: false, default: 0 })
        page: 0;

        notFound: boolean = false;

        promptContent: PromptContent | null = null;
        prompt: ReflectionPrompt | null;
        responses: ReflectionResponse[] | null;

        promptContentUnsubscriber: ListenerUnsubscriber | null = null;
        promptUnsubscriber: ListenerUnsubscriber | null = null;
        reflectionResponsesUnsubscriber: ListenerUnsubscriber | null = null;


        promptContentLoading: boolean = false;
        promptLoading = false;
        responsesLoading = false;

        promptHasLoaded = false;
        responsesHasLoaded = false;

        get loading(): boolean {
            return this.promptContentLoading || this.promptLoading || this.responsesLoading || !this.responsesHasLoaded || !this.promptHasLoaded;
        }

        @Watch("_promptId")
        onPromptId(currentId: string | null, oldId: string | null) {
            if (currentId !== oldId) {
                this.setupPromptObserver();
            }
        }

        @Watch("_entryId")
        onEntryId(currentId: string | null, oldId: string | null) {
            if (currentId !== oldId) {
                this.setupPromptObserver();
            }
        }

        @Watch("promptContent")
        onPromptContent(current: PromptContent | null, previous: PromptContent | null) {
            if (current?.promptId !== previous?.promptId) {
                logger.info("promptContent.promptId changed, updating response + prompt observers");
                this.setupResponseObserver();
                this.setupPromptObserver();
            }
        }

        beforeMount() {
            if (!this._promptId && !this._entryId) {
                this.notFound = true;
            }
            this.setupPromptContentObserver();
        }

        destroyed() {
            this.promptContentUnsubscriber?.();
            this.reflectionResponsesUnsubscriber?.();
            this.promptUnsubscriber?.();
        }

        nextPage() {
            this.setPageIndex(this.page + 1);
        }

        previousPage() {
            this.setPageIndex(this.page - 1);
        }

        setPageIndex(index: number) {
            const boundedIndex = Math.min(Math.max(index, 0), (this.promptContent?.content.length ?? 1) - 1);
            if (boundedIndex === this.page) {
                return;
            }
            const id = this._entryId ?? this._promptId;
            const params: Record<string, string | number | boolean> = {};
            if (this._promptId) {
                params[QueryParam.USE_PROMPT_ID] = true;
            }

            const basePath = `${ PageRoute.PROMPTS_ROOT }/${ id }`

            if (boundedIndex > 0) {
                pushRoute(`${ basePath }/${ boundedIndex }`);
            } else {
                pushRoute(`${ basePath }`);
            }

        }

        setupPromptContentObserver() {
            logger.info("Setting up prompt observer for id", this._promptId ?? this._entryId);
            this.promptContentLoading = true;
            this.promptContentUnsubscriber?.();

            this.promptContentUnsubscriber = PromptContentService.sharedInstance.observeByPromptOrEntryId({
                entryId: this._entryId,
                promptId: this._promptId
            }, {
                onData: async (promptContent?: PromptContent, error?: any) => {
                    this.promptContentLoading = false;
                    if (!promptContent) {
                        this.notFound = true;
                        return
                    }
                    this.promptContent = promptContent ?? null;
                }
            });
        }

        setupResponseObserver() {
            this.reflectionResponsesUnsubscriber?.();
            const promptId = this.promptContent?.promptId;
            if (!promptId) {
                this.responses = null;
                this.responsesLoading = false;
                return;
            }
            this.responsesLoading = true;
            ReflectionResponseService.sharedInstance.observeForPromptId(promptId, {
                onData: (responses) => {
                    this.responses = responses ?? null;
                    this.responsesLoading = false;
                    this.responsesHasLoaded = true;
                }
            })
        }

        setupPromptObserver() {
            this.promptUnsubscriber?.();
            const promptId = this.promptContent?.promptId;
            if (!promptId) {
                this.prompt = null;
                this.promptLoading = false;
                return;
            }
            this.promptLoading = true;
            ReflectionPromptService.sharedInstance.observeById(promptId, {
                onData: (prompt) => {
                    this.prompt = prompt ?? null;
                    this.promptLoading = false;
                    this.promptHasLoaded = true;
                }
            })
        }
    }
</script>

<style scoped lang="scss">
    @import "transitions";
</style>