<template>
    <div class="journalEntry" v-bind:class="{ new: !responseText }">

        <div class="dateContainer menuParent">
            <div class="dates">
                <div class="doneStatus" v-show="responsesLoaded && (responses.length !== 0 || responseText)">Done</div>
                <h4 class="date">{{promptDate}}</h4>
            </div>

            <dropdown-menu :items="linkItems"/>
        </div>


        <h3 class="question">{{questionText}}</h3>
        <p v-show="!prompt && promptLoaded" class="warning prompt">
            Oops! We were unable to load the question for this day.
        </p>

        <div class="entry" v-if="!doReflect">{{responseText}}</div>

        <edit-reflection
                :show="doReflect"
                :responses="responses"
                :prompt="prompt"
                :responseMedium="responseMedium"
                @close="doReflect = false"
        />

        <nav v-show="!doReflect && responsesLoaded" class="buttonContainer">
            <a v-if="prompt && prompt.contentPath" :href="prompt.contentPath" class="secondary small button">
                Reflect
            </a>
        </nav>

    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import ReflectionPrompt from '@shared/models/ReflectionPrompt'
    import ReflectionResponse, {ResponseMedium} from "@shared/models/ReflectionResponse"
    import {getResponseText} from "@shared/util/StringUtil"
    import {formatDate} from "@shared/util/DateUtil"
    import SentPrompt from "@shared/models/SentPrompt"
    import DropdownMenu from "@components/DropdownMenu.vue";
    import EditReflection from "@components/ReflectionResponseTextEdit.vue"

    export default Vue.extend({
        components: {
            DropdownMenu,
            EditReflection,
        },
        created() {

        },
        props: {
            prompt: {
                type: Object as () => ReflectionPrompt,
                required: true,
            },
            sentPrompt: {
                type: Object as () => SentPrompt,
                required: true,
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
            editedText: string,
            editedResponses: { id: string | undefined, text: string }[],
            responseMedium: ResponseMedium,
        } {
            return {
                doReflect: false,
                editedText: "",
                editedResponses: [],
                responseMedium: ResponseMedium.JOURNAL_WEB,
            }
        },
        computed: {
            promptDate(): string | undefined {
                return formatDate(this.sentPrompt.firstSentAt, "LLLL d, yyyy")
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
            responseText(): string | undefined {
                return getResponseText(this.responses);
            },
            questionText(): string | undefined {
                if (this.prompt) {
                    return this.prompt.question
                }

                if (this.responses.length > 0) {
                    return this.responses[0].promptQuestion;
                }
                return;
            }
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
