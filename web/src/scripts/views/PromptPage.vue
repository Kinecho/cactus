<template>
    <four-oh-four v-if="notFound"/>
    <div v-else class="prompt-page">
        <transition mode="out-in" name="component-fade" appear>
            <spinner v-if="loading" :delay="1200" message="Loading"/>
            <prompt-content v-else
                    :cards="cards"
                    :responses="responses"
                    :index="page - 1"
                    @close="close"
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
    import { removeQueryParam } from "@web/util";
    import PromptContentCardViewModel from "@components/promptcontent/PromptContentCardViewModel";
    import { RoutePageMeta, setPageMeta } from "@web/router-meta";
    import { getCloudinaryUrlFromStorageUrl } from "@shared/util/ImageUtil";

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

        /**
         * Current page starting at one. Content index should be page - 1.
         */
        @Prop({ type: Number, required: false, default: 10 })
        page!: number;

        notFound: boolean = false;

        promptContent: PromptContent | null = null;
        prompt: ReflectionPrompt | null = null;
        responses: ReflectionResponse[] | null = null;

        promptContentUnsubscriber: ListenerUnsubscriber | null = null;
        promptUnsubscriber: ListenerUnsubscriber | null = null;
        reflectionResponsesUnsubscriber: ListenerUnsubscriber | null = null;

        promptContentLoading: boolean = false;
        promptLoading = false;
        responsesLoading = false;

        promptHasLoaded = false;
        responsesHasLoaded = false;

        get cards(): PromptContentCardViewModel[] {
            const prompt = this.prompt;
            const promptContent = this.promptContent;
            const responses = this.responses;
            const member = this.member;

            if (!prompt || !promptContent || this.loading) {
                return [];
            }

            return PromptContentCardViewModel.createAll({ responses, promptContent, prompt, member });
        }

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
        async onPromptContent(current: PromptContent | null, previous: PromptContent | null) {
            if (current?.entryId && current.entryId !== this._entryId) {
                logger.info("Navigating to the current.entryId")
                // pushRoute(`${ PageRoute.PROMPTS_ROOT }/${ current.entryId }`);
                removeQueryParam(QueryParam.USE_PROMPT_ID);
                await this.setPageIndex(this.page);
            }

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

        async close() {
            await pushRoute(PageRoute.MEMBER_HOME);
        }

        async setPageIndex(index: number) {
            const boundedIndex = Math.min(Math.max(index, 1), this.cards.length ?? 1);
            const id = this.promptContent?.entryId ?? this._entryId;
            if (boundedIndex === this.page && this.$route.params.id === id) {
                logger.info("Not navigating anywhere, page index is the same and so is the ID");
                return;
            }

            const basePath = `${ PageRoute.PROMPTS_ROOT }/${ id }`
            logger.info("navigating to route ", basePath)
            if (boundedIndex > 1) {
                await pushRoute(`${ basePath }/${ boundedIndex }`);
            } else {
                await pushRoute(`${ basePath }`);
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
                    this.updateDocumentMeta()
                }
            }) ?? null;
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

        updateDocumentMeta() {
            logger.info("Prompt content updating meta");
            let title = this.promptContent?.subjectLine ?? this.promptContent?.getPreviewText() ?? 'Cactus Mindful Moment';

            const description = "Reflect on this mindful moment from Cactus.";
            let pageMeta: RoutePageMeta = {
                description,
                title,
            }

            const imageUrl = this.promptContent?.getOpenGraphImageUrl();
            let pngUrl: string | null = null;
            if (imageUrl) {
                pngUrl = getCloudinaryUrlFromStorageUrl({
                    storageUrl: imageUrl,
                    width: 1200,
                    transforms: ["w_1200", "h_630", "f_png", "c_lpad"]
                });
                pageMeta.image = {
                    url: pngUrl,
                    height: 630,
                    width: 1200,
                    type: "image/png",
                }
            }
            logger.info("Prompt Content Meta Image is", pageMeta.image);
            setPageMeta(pageMeta, title)
            window.prerenderReady = true;
        }
    }
</script>

<style scoped lang="scss">
    @import "transitions";
</style>