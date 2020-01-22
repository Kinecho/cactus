<template>
    <div class="page-wrapper">
        <div v-if="show404">
            <FourOhFour/>
        </div>
        <div class="reflection-container" v-if="responses" v-for="response in responses">
            <SharedReflectionCard :response="response" class="full"/>
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

                        // setup observer for responses that are shared with you
                        if (this.member?.id && this.promptId) {
                            this.sharedResponsesUnsubscriber = ReflectionResponseService.sharedInstance.observeTradedByEntryId(this.member.id, this.promptId, {
                                onData: async (responses: ReflectionResponse[]): Promise<void> => {
                                    this.responses = responses;
                                }
                            });
                        }
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
            responses: ReflectionResponse[] | undefined
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
                responses: undefined
            }
        },
        methods: {
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
            }
        },
        watch: {
            member() {
                this.setupResponseObserver();
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
