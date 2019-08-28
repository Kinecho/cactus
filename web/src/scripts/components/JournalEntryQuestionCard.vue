<template>
    <div class="journalEntry" v-bind:class="{ new: !responseText }">

        <div class="dateContainer menuParent">
            <div class="dates">
                <div class="doneStatus" v-show="responsesLoaded && (responses.length !== 0 || responseText)">Done</div>
                <p class="date">{{promptDate}}</p>
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
            <a v-if="prompt && prompt.contentPath && !responseText" :href="prompt.contentPath" class="button">
                <svg class="wiggle" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path fill="#fff" d="M3 3h6a1 1 0 0 1 .117 1.993L9 5H3a1 1 0 0 0-.993.883L2 6v11a1 1 0 0 0 .883.993L3 18h11a1 1 0 0 0 .993-.883L15 17v-6a1 1 0 0 1 1.993-.117L17 11v6a3 3 0 0 1-2.824 2.995L14 20H3a3 3 0 0 1-2.995-2.824L0 17V6a3 3 0 0 1 2.824-2.995L3 3h6zm10-3h6.02c.023 0 .046.002.07.004L19 0a1.008 1.008 0 0 1 .595.196c.04.03.077.061.112.097l-.09-.08a1.006 1.006 0 0 1 .376.67l.003.03.003.055L20 1v6a1 1 0 0 1-1.993.117L18 7V3.414l-9.293 9.293a1 1 0 0 1-1.32.083l-.094-.083a1 1 0 0 1 0-1.414L16.584 2H13a1 1 0 0 1-.117-1.993L13 0h6z"/></svg>
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
                        title: "Reflect",
                        onClick: () => {
                            alert("Clicked reflect")
                        }
                    })
                }

                if (this.responses.length > 0) {
                    linkItems.push({
                        title: "Edit Note",
                        onClick: () => {
                            this.doReflect = true;
                        }
                    })
                } else {
                    linkItems.push({
                        title: "Write a Note",
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
