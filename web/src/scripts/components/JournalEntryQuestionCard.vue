<template>
    <div class="journalEntry" v-bind:class="{new: !this.responseText, isDone: this.responseText, hasNote: this.responseText}">
        <p class="date">{{promptDate}}</p>
        <div class="menuParent">
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
            <a v-if="prompt && prompt.contentPath && !responseText" :href="prompt.contentPath" class="button">Reflect</a>
            <button @click.prevent="doReflect = true" class="wiggle secondary" v-show="!this.responseText">
                <img src="/assets/images/pen.svg" alt=""/>
                Add a Note
            </button>
        </nav>

    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import ReflectionPrompt from '@shared/models/ReflectionPrompt'
    import ReflectionResponse from "@shared/models/ReflectionResponse"
    import {getResponseText} from "@shared/util/StringUtil"
    import {formatDate} from "@shared/util/DateUtil"
    import SentPrompt from "@shared/models/SentPrompt"
    import DropdownMenu from "@components/DropdownMenu.vue";
    import EditReflection from "@components/ReflectionResponseTextEdit.vue"
    import JournalEntry from '@web/datasource/models/JournalEntry'
    import CopyService from "@shared/copy/CopyService";
    import CactusMember from "@shared/models/CactusMember";
    import { ResponseMedium } from "@shared/util/ReflectionResponseUtil";

    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
        components: {
            DropdownMenu,
            EditReflection,
        },
        created() {

        },
        props: {
            member: Object as () => CactusMember,
            entry: {
                type: Object as () => JournalEntry,
                required: true,
            },
        },
        data(): {
            doReflect: boolean,
            editedText: string,
            editedResponses: { id: string | undefined, text: string }[],
            responseMedium: ResponseMedium,
            prompt: ReflectionPrompt,
            sentPrompt: SentPrompt | undefined,
            responses: ReflectionResponse[]|undefined,
            responsesLoaded: boolean,
        } {
            return {
                doReflect: false,
                editedText: "",
                editedResponses: [],
                responseMedium: ResponseMedium.JOURNAL_WEB,
                responses: this.entry.responses,
                prompt: this.entry.prompt!,
                sentPrompt: this.entry.sentPrompt,
                responsesLoaded: this.entry.responsesLoaded,
            }
        },
        computed: {
            promptDate(): string | undefined {
                if (this.sentPrompt?.firstSentAt) {
                    return formatDate(this.sentPrompt.firstSentAt, copy.settings.dates.longFormat);
                } else {
                    return formatDate(new Date(), copy.settings.dates.longFormat);
                }
            },
            linkItems(): {
                title: string,
                href?: string,
                onClick?: () => void,
            }[] {
                const linkItems: {
                    title: string,
                    href?: string,
                    onClick?: () => void,
                }[] = [];
                if (this.responses && this.responses.length > 0) {
                    linkItems.push({
                        title: "Edit Note",
                        onClick: () => {
                            this.doReflect = true;
                        }
                    })
                } else {
                    linkItems.push({
                        title: "Add a Note",
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

                if (this.responses && this.responses.length > 0) {
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
