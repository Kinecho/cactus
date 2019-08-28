<template>
    <div class="journalEntry" v-bind:class="{new: !this.responseText,}">
        <div class="dateContainer menuParent">
            <div class="dates">
                <div class="doneStatus" v-show="responsesLoaded && (responses.length !== 0 || responseText)">Done</div>
                <h4 class="date">{{promptDate}}</h4>
            </div>

            <dropdown-menu :items="linkItems"/>
        </div>

        <div v-if="error">
            <p v-show="error" class="warning prompt">
                {{error}}
            </p>
        </div>
        <div v-if="promptContent">

            <h3 class="topic" v-show="topicText">{{topicText}}</h3>
            <p class="subtext" v-show="subText">{{subText}}</p>
        </div>
        <div class="entry" v-if="!doReflect">{{responseText}}</div>
        <edit-reflection
                :show="doReflect"
                :responses="responses"
                :prompt="prompt"
                :responseMedium="responseMedium"
                @close="doReflect = false"
        />

        <div class="backgroundImage" :class="backgroundClasses"></div>

        <nav v-show="!doReflect" class="buttonContainer">
            <a :href="promptContentPath" @click.prevent="showContent = true" class="button">Reflect</a>
        </nav>
        <modal v-if:show="showContent" v-on:close="showContent = false" :showCloseButton="true">
            <PromptContent slot="body" v-bind:promptContentEntryId="entryId" v-on:close="showContent = false"/>
        </modal>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import PromptContent, {Content} from "@shared/models/PromptContent"
    import {ListenerUnsubscriber} from '@web/services/FirestoreService'
    import PromptContentService from '@web/services/PromptContentService'
    import {PageRoute} from "@web/PageRoutes"
    import PromptContentVue from "@components/PromptContent.vue"
    import SentPrompt from "@shared/models/SentPrompt"
    import {formatDate} from "@shared/util/DateUtil"
    import ReflectionResponse, {ResponseMedium} from "@shared/models/ReflectionResponse"
    import ReflectionPrompt from '@shared/models/ReflectionPrompt'
    import {getIntegerFromStringBetween, getResponseText} from "@shared/util/StringUtil"
    import DropdownMenu from "@components/DropdownMenu.vue";
    import Modal from "@components/Modal.vue"
    import EditReflection from "@components/ReflectionResponseTextEdit.vue"

    export default Vue.extend({
        components: {
            Modal,
            DropdownMenu,
            PromptContent: PromptContentVue,
            EditReflection,
        },
        created() {
            this.promptContentUnsubscriber = PromptContentService.sharedInstance.observeByEntryId(this.entryId, {
                onData: (promptContent, error) => {
                    this.error = undefined;
                    if (error) {
                        console.error("JournalEntryPromptContentCard: Failed to get prompt content via subscriber", error);
                        this.promptContent = undefined;
                        this.error = "Unable to load the prompt";
                        this.loading = false;
                        return;
                    }

                    if (!promptContent) {
                        this.error = "Oops, we were unable to find the Prompt for this day."
                    } else {
                        this.promptContent = promptContent;
                    }
                    this.loading = false;
                }
            });
        },
        props: {
            entryId: {type: String, required: true},
            prompt: {type: Object as () => ReflectionPrompt},
            sentPrompt: {
                type: Object as () => SentPrompt
            },
            responses: {
                type: Array as () => ReflectionResponse[],
                required: false,
                default: [],
            },
            responsesLoaded: Boolean,
        },
        data(): {
            doReflect: boolean,
            promptContent: PromptContent | undefined,
            error: any | undefined,
            promptContentUnsubscriber: ListenerUnsubscriber | undefined,
            loading: boolean,
            showContent: boolean,
            editedText: string,
            editedResponses: { id: string | undefined, text: string }[],
            responseMedium: ResponseMedium,
        } {
            return {
                doReflect: false,
                promptContent: undefined,
                error: undefined,
                promptContentUnsubscriber: undefined,
                loading: true,
                showContent: false,
                editedText: "",
                editedResponses: [],
                responseMedium: ResponseMedium.JOURNAL_WEB,
            }
        },
        computed: {
            backgroundClasses(): { [name: string]: string } {
                const [first]: Content[] = (this.promptContent && this.promptContent.content) || []
                const bgImage = first ? first.backgroundImage : undefined;
                const id = this.prompt.id;

                const showRandomBackground = !bgImage || true;

                const classes: { [name: string]: any } = {
                    randomBackground: showRandomBackground,
                    [`bg${getIntegerFromStringBetween(id || "", 4)}`]: showRandomBackground
                };

                return classes;
            },
            topicText(): string | undefined {
                return this.promptContent && this.promptContent.subjectLine;
            },
            subText(): string | undefined {
                if (!this.promptContent) {
                    return;
                }

                const [first]: Content[] = (this.promptContent && this.promptContent.content) || [];
                return first && first.text
            },
            promptContentPath(): string {
                return `${PageRoute.PROMPTS_ROOT}/${this.entryId}`
            },
            promptDate(): string | undefined {
                return formatDate(this.sentPrompt.firstSentAt, "LLLL d, yyyy")
            },
            responseText(): string | undefined {
                return getResponseText(this.responses);
            },
            linkItems(): {
                title: string,
                href?: string,
                onClick?: () => void,
            }[] {
                const linkItems = [{
                    title: "Share Prompt",
                    onClick: () => {
                        alert("Clicked share")
                    }
                }];

                if (this.responses.length > 0) {
                    linkItems.push({
                        title: "Edit Reflection",
                        onClick: () => {
                            this.doReflect = true;
                        }
                    })
                } else {
                    linkItems.push({
                        title: "Add Reflection",
                        onClick: () => {
                            this.doReflect = true;
                        }
                    })
                }

                return linkItems
            },
        },
        methods: {}
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";
    @import "journal";


</style>
