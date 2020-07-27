<template>
    <div class="shared-reflection-page">
        <NavBar :isSticky="false" :forceTransparent="true" :showSignup="true"/>
        <div class="content" v-if="!loading">
            <div v-if="error" class="error">{{error}}</div>
            <div class="reflection-container" v-if="reflectionResponse">
                <card v-if="reflectionResponse"
                        class="full"
                        :prompt="prompt"
                        :response="reflectionResponse"
                        :prompt-content="promptContent"
                        :question="questionText"
                        :memberProfile="memberProfile"

                />
            </div>
            <sign-up-footer/>
        </div>
        <div v-else>
            <spinner :delay="1000"/>
        </div>
        <Footer/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import { PageRoute } from "@shared/PageRoutes"
    import NavBar from "@components/NavBar.vue"
    import Footer from "@components/StandardFooter.vue"
    import ReflectionResponseService from '@web/services/ReflectionResponseService'
    import ReflectionResponse from "@shared/models/ReflectionResponse"
    import CopyService from "@shared/copy/CopyService"
    import Card from "@components/SharedReflectionCard.vue";
    import { ListenerUnsubscriber } from '@web/services/FirestoreService'
    import SignUpFooter from "@components/SignUpFooter.vue";
    import { formatDate } from '@shared/util/DateUtil'
    import PromptContent from "@shared/models/PromptContent"
    import ReflectionPrompt from "@shared/models/ReflectionPrompt"
    import PromptContentService from '@web/services/PromptContentService'
    import ReflectionPromptService from '@web/services/ReflectionPromptService'
    import { getPromptQuestion, isBlank } from '@shared/util/StringUtil'
    import MemberProfile from "@shared/models/MemberProfile";
    import MemberProfileService from '@web/services/MemberProfileService';
    import Logger from "@shared/Logger";
    import { RoutePageMeta, setPageMeta } from "@web/router-meta";
    import { getCloudinaryUrlFromStorageUrl } from "@shared/util/ImageUtil";
    import Spinner from "@components/Spinner.vue";

    const logger = new Logger("SharedReflectionPage.vue");
    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
        components: {
            NavBar,
            Footer,
            Card,
            SignUpFooter,
            Spinner,
        },
        created() {

        },
        props: {},
        data(): {
            reflectionResponseId: string | undefined,
            error: string | undefined,
            responseUnsubscriber: ListenerUnsubscriber | undefined,
            reflectionResponse: ReflectionResponse | undefined,
            promptContent: PromptContent | undefined,
            prompt: ReflectionPrompt | undefined,
            memberProfile: MemberProfile | undefined,
            fetchingData: boolean,
        } {
            return {
                reflectionResponseId: undefined,
                error: undefined,
                responseUnsubscriber: undefined,
                reflectionResponse: undefined,
                prompt: undefined,
                promptContent: undefined,
                memberProfile: undefined,
                fetchingData: false,
            }
        },
        beforeMount() {
            let responseId: string | undefined = undefined;
            try {
                responseId = window.location.pathname.split(`${ PageRoute.SHARED_REFLECTION }/`)[1].split("/")[0]
            } catch (error) {
                logger.error("Failed to parse path to get reflection id", error);
            }

            if (!responseId) {
                this.error = "Invalid URL";
                return;
            }

            this.reflectionResponseId = responseId;
            this.fetchingData = true;
            this.responseUnsubscriber = ReflectionResponseService.sharedInstance.observeSharedReflection(responseId, {
                onData: async (reflectionResponse, error) => {
                    if (error || !reflectionResponse) {
                        this.error = "This reflection does not exist or you do not have permission to view it";
                        this.reflectionResponse = undefined;
                        return;
                    }
                    this.error = undefined;
                    this.reflectionResponse = reflectionResponse;

                    if (this.reflectionResponse?.promptId) {
                        const [promptContent, prompt] = await Promise.all([
                            PromptContentService.sharedInstance.getByPromptId(this.reflectionResponse.promptId),
                            ReflectionPromptService.sharedInstance.getById(this.reflectionResponse.promptId)
                        ]);

                        this.promptContent = promptContent;
                        this.prompt = prompt;
                    }

                    if (this.reflectionResponse?.cactusMemberId) {
                        this.memberProfile = await MemberProfileService.sharedInstance.getByMemberId(this.reflectionResponse.cactusMemberId);
                    }

                    this.updateDocumentMeta();
                    this.fetchingData = false;
                }
            })
        },
        beforeDestroy() {
            if (this.responseUnsubscriber) {
                this.responseUnsubscriber();
            }
        },
        computed: {
            loading(): boolean {
                return this.fetchingData;
            },
            questionText(): string {
                if (!this.reflectionResponse || this.loading) {
                    return "";
                }

                const coreValue = this.reflectionResponse.coreValue ?? undefined;
                return this.promptContent?.getDynamicQuestionText({ coreValue }) ?? this.reflectionResponse.promptQuestion ?? ""
            }
        },
        methods: {
            updateDocumentMeta() {
                if (this.reflectionResponse) {
                    let identifier = this.memberProfile?.getFullName() || this.reflectionResponse.memberEmail;
                    let question = getPromptQuestion({
                        promptContent: this.promptContent,
                        response: this.reflectionResponse,
                        prompt: this.prompt
                    });
                    let shareDate = formatDate(this.reflectionResponse.sharedAt, copy.settings.dates.longFormat);

                    let title = `Read ${ identifier }'s private note`;
                    if (question) {
                        title = `Read ${ identifier }'s private note on '${ question }'`;
                    }

                    let description = `This reflection note was shared on ${ shareDate }.`;


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
                    setPageMeta(pageMeta, title)
                }
            }
        },
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .shared-reflection-page {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 100vh;
    }

    header {
        width: 100%;
    }

    .content {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
    }

    .reflection-container {
        flex-grow: 1;
        padding: 6.4rem 2.4rem;
    }

    .error {
        background-color: $lightPink;
        color: $darkestPink;
        margin: 2.4rem auto;
        max-width: 64rem;
        padding: 2.4rem;
        width: 100%;

        @include r(768) {
            border-radius: 6px;
        }
    }

</style>
