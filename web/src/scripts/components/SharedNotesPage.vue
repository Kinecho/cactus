<template>
    <div class="sharedNotesPage">
        <div class="centered">
            <div v-if="show404">
                <FourOhFour/>
            </div>
            <template v-if="viewerResponse">
                <h2>Shared Reflections to {{promptId}}</h2>
                <p class="subtext">In order to see notes shared with you, you'll need to share your reflection back with them. Sharing promotes a healthier mind through connection with&nbsp;others.</p>
                <button v-if="viewerResponse && !tradeComplete(response)" class="shareBackBtn" @click="shareWith(response.cactusMemberId)">Share Back</button>
                <SharedReflectionCard :response="viewerResponse" class="full"/>
            </template>
            <div class="not-reflected" v-else-if="promptContentPath">
                <p>In order to see notes shared with you, you'll need to first reflect and share back.</p>
                <a class="button" :href="promptContentPath">Reflect &amp; Share</a>
            </div>
            <template class="reflection-container" v-if="responses" v-for="response in responses">
                <SharedReflectionCard :response="response" class="full" :obscureCard="!tradeComplete(response)"/>
            </template>
            <p class="shareBackMsg" v-if="viewerResponse && !tradeComplete(response)">Once you tap Share Back, you'll be able to see their note and your reflection (above) will be shared with them.</p>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {PageRoute} from '@shared/PageRoutes'
    import FourOhFour from "@components/404.vue"
    import PromptContent, {Content, ContentType} from '@shared/models/PromptContent'
    import {ListenerUnsubscriber} from '@web/services/FirestoreService'
    import PromptContentService from "@web/services/PromptContentService";
    import ReflectionResponseService from '@web/services/ReflectionResponseService'
    import ReflectionResponse from "@shared/models/ReflectionResponse"
    import CactusMemberService from '@web/services/CactusMemberService'
    import CactusMember from '@shared/models/CactusMember'
    import SharedReflectionCard from "@components/SharedReflectionCard.vue";
    import Logger from "@shared/Logger";

    const logger = new Logger("PromptContent.vue");

    export default Vue.extend({
        components: {
            FourOhFour,
            SharedReflectionCard
        },
        beforeMount(){
            this.memberUnsubscriber = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: ({member}) => {
                    this.member = member;
                }
            });

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
                        this.promptId = promptContent.promptId;
                        this.loading = false;
                    }
                };

                this.promptsUnsubscriber = PromptContentService.sharedInstance.observeByEntryId(this.promptContentEntryId, flamelinkOptions)

            } else {
                this.show404 = true;
            }
        },
        data():{
            promptId: string | undefined,
            promptContentEntryId: string | undefined,
            promptContent: PromptContent | undefined,
            loading: boolean,
            error: string | undefined,
            show404: boolean,
            promptsUnsubscriber: ListenerUnsubscriber | undefined,
            sharedResponsesUnsubscriber: ListenerUnsubscriber | undefined,
            memberUnsubscriber: ListenerUnsubscriber | undefined,
            member: CactusMember | undefined,
            responses: ReflectionResponse[] | undefined,
            viewerResponse: ReflectionResponse | undefined,
            viewerResponseUnsubscriber: ListenerUnsubscriber | undefined
        }{
            return {
                promptId: undefined,
                promptContentEntryId: undefined,
                promptContent: undefined,
                promptsUnsubscriber: undefined,
                sharedResponsesUnsubscriber: undefined,
                memberUnsubscriber: undefined,
                member: undefined,
                show404: false,
                error: undefined,
                loading: false,
                responses: undefined,
                viewerResponse: undefined,
                viewerResponseUnsubscriber: undefined
            }
        },
        computed: {
            promptContentPath(): string | undefined {
                if (this.promptContentEntryId) {
                    return `${PageRoute.PROMPTS_ROOT}/${this.promptContentEntryId}`
                }
                return;
            }
        },
        methods: {
            tradeComplete(response: ReflectionResponse): boolean {
                if (this.member?.id &&
                    response?.cactusMemberId &&
                    this.viewerResponse?.tradedWithMemberIds?.includes(response.cactusMemberId) &&
                    response.tradedWithMemberIds?.includes(this.member.id)) {
                    return true;
                } else {
                    return false;
                }
            },
            setupResponseObserver(): void {
                if (!this.sharedResponsesUnsubscriber &&
                    this.member?.id &&
                    this.promptId) {
                    this.sharedResponsesUnsubscriber = ReflectionResponseService.sharedInstance.observeTradedByEntryId(this.member.id, this.promptId, {
                        onData: async (responses: ReflectionResponse[]): Promise<void> => {
                            this.responses = responses;
                        }
                    });
                }
            },
            setupViewerResponseObserver(): void {
                if (!this.viewerResponseUnsubscriber &&
                    this.member?.id &&
                    this.promptId) {
                    this.viewerResponseUnsubscriber = ReflectionResponseService.sharedInstance.observeForPromptId(this.promptId, {
                        onData: async (responses: ReflectionResponse[]): Promise<void> => {
                            this.viewerResponse = responses[0];
                        }
                    });
                }
            },
            async shareWith(cactusMemberId: string) {
                let selectedFriends = [cactusMemberId];

                if (this.viewerResponse) {
                    if (this.viewerResponse.tradedWithMemberIds) {
                        selectedFriends = selectedFriends.concat(this.viewerResponse.tradedWithMemberIds);
                    }
                }

                const result = await ReflectionResponseService.sharedInstance.tradeResponse(this.viewerResponse, selectedFriends);
            }
        },
        watch: {
            member() {
                this.setupResponseObserver();
                this.setupViewerResponseObserver();
            },
            promptId() {
                this.setupResponseObserver();
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .sharedNotesPage {
        .centered {
            max-width: 70rem;
            padding: 6.4rem 2.4rem 0;

            @include r(600) {
                padding: 6.4rem 2.4rem;
            }
        }

        .subtext {
            margin-bottom: 1.6rem;
            opacity: .8;
        }
    }

    .shareBackBtn {
        margin-bottom: 4rem;
        max-width: 28rem;
        width: 100%;
    }

    .shared-reflection-card + .shared-reflection-card {
        margin-top: -1.6rem;
    }

    .shareBackMsg {
        background-color: $lightestGreen;
        margin: 4.8rem -2.4rem 0;
        padding: 3.2rem 2.4rem;

        @include r(600) {
            border-radius: 1.2rem;
            margin: 3.2rem auto 2.4rem;
            max-width: 64rem;
        }
    }

</style>
