<template>
    <form v-show="show" v-on:submit.prevent>
        <div v-for="editedResponse in editedResponses">
            <resizable-textarea :maxHeightPx="400">
                <textarea v-model="editedResponse.text"></textarea>
            </resizable-textarea>

        </div>
        <nav class="buttonContainer">
            <button class="primary small" v-on:click="doneEditing" type="button">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 13">
                    <path fill="#fff" d="M1.707 6.293A1 1 0 0 0 .293 7.707l5 5a1 1 0 0 0 1.414 0l11-11A1 1 0 1 0 16.293.293L6 10.586 1.707 6.293z"/>
                </svg>
                Done
            </button>
            <button class="secondary small" v-on:click="cancelEditing" type="button">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                    <path d="M13.851 12l7.762 7.761a1.3 1.3 0 0 1 0 1.852c-.249.248-.58.387-.926.387-.347 0-.678-.14-.926-.387L12 13.85l-7.761 7.762c-.248.248-.58.387-.926.387-.346 0-.677-.14-.926-.387a1.3 1.3 0 0 1 0-1.852L10.15 12 2.387 4.239a1.3 1.3 0 0 1 0-1.852 1.3 1.3 0 0 1 1.852 0L12 10.15l7.761-7.762a1.3 1.3 0 0 1 1.852 0 1.3 1.3 0 0 1 0 1.852L13.85 12z"/>
                </svg>
                Cancel
            </button>
        </nav>
    </form>
</template>

<script lang="ts">
    import Vue from "vue";
    import ReflectionResponse from "@shared/models/ReflectionResponse"
    import SentPromptService from "@web/services/SentPromptService"
    import ReflectionResponseService from "@web/services/ReflectionResponseService"
    import ReflectionPrompt from "@shared/models/ReflectionPrompt"
    import { getResponseText } from "@shared/util/StringUtil"
    import ResizableTextarea from "@components/ResizableTextarea.vue"
    import Logger from "@shared/Logger";
    import PromptContent from "@shared/models/PromptContent";
    import CactusMember from "@shared/models/CactusMember";
    import { ResponseMedium } from "@shared/util/ReflectionResponseUtil";

    const logger = new Logger("ReflectionResponseTextEdit.vue");
    export default Vue.extend({
        components: {
            ResizableTextarea,
        },
        created() {

        },
        props: {
            show: {
                type: Boolean,
                default: false
            },
            responses: {
                type: Array as () => ReflectionResponse[],
                required: false,
                default: []
            },
            prompt: {
                type: Object as () => ReflectionPrompt,
                required: true,
            },
            promptContent: {
                type: Object as () => PromptContent,
            },
            member: Object as () => CactusMember,
            responseMedium: {
                type: String as () => ResponseMedium,
                default: ResponseMedium.JOURNAL_WEB,
                required: true,
            }
        },
        data(): {
            editedText: string,
            editedResponses: { id: string | undefined, text: string }[],
        } {
            return {
                editedText: "",
                editedResponses: [],
            }
        },
        watch: {
            show(doShow, oldValue) {
                if (doShow) {
                    this.startEditing();
                }
            },
        },
        computed: {
            responseText(): string | undefined {
                return getResponseText(this.responses);
            },
        },
        methods: {
            close() {
                this.$emit("close")
            },
            async doneEditing() {
                // this.doReflect = false;
                this.$emit("close");

                const responsesById: { [id: string]: ReflectionResponse } = this.responses.reduce((map: { [id: string]: ReflectionResponse }, response) => {
                    if (response.id) {
                        map[response.id as string] = response;
                    }
                    return map;
                }, {});

                const tasks: Promise<any>[] = [];
                this.editedResponses.forEach(edit => {
                    return new Promise(async resolve => {
                        let response = edit.id ? responsesById[edit.id] : undefined;


                        if (!response && this.prompt && this.prompt.id) {
                            response = await ReflectionResponseService.createReflectionResponse(this.prompt.id, this.responseMedium, this.prompt.question)
                        }
                        //We used to delete the response if the text was deleted, but we don't want to do that anymore.
                        // This may cause non-ideal experiences if you have more than one response,
                        // but that's an edge case that should not happen in practice
                        if (response) {
                            if (!response?.coreValue) {
                                response.coreValue = this.member?.getCoreValueAtIndex(this.promptContent?.preferredCoreValueIndex ?? 0) ?? null
                            }

                            response.content.text = edit.text.trim();
                            //saving will trigger a refresh of the data elsewhere, so we shouldn't need to update anything here;
                            await ReflectionResponseService.sharedInstance.save(response);
                        } else {
                            logger.error("There was no response available to save... this shouldn't happen");
                        }
                        resolve();
                    })
                });
                await Promise.all(tasks);

            },
            cancelEditing() {
                const responsesById: { [id: string]: ReflectionResponse } = this.responses.reduce((map: { [id: string]: ReflectionResponse }, response) => {
                    if (response.id) {
                        map[response.id as string] = response;
                    }
                    return map;
                }, {});

                const foundChange = this.editedResponses.find(edit => {
                    if (!edit.id && edit.text.trim()) {
                        return true;
                    } else if (edit.id && responsesById[edit.id]) {
                        const response = responsesById[edit.id];
                        const existingText = response.content.text || "";
                        return existingText.trim() !== edit.text.trim();
                    }
                    return false;
                });

                if (foundChange) {
                    const c = confirm("You have unsaved changes. Are you sure you want to cancel?");
                    if (c) {
                        logger.log("confirmed cancel");
                        // this.editedText = this.responseText;
                        // this.doReflect = false;
                        this.close();
                    } else {
                        logger.log("don't cancel");
                    }
                } else {
                    logger.log("no changes, just closing");
                    // this.doReflect = false;
                    this.close();
                }
            },
            async deleteSentPrompt() {

                const c = confirm("Are you sure you want to ignore this question? It will no longer be available in your journal");
                if (!c) {
                    return;
                }

                if (this.prompt && this.prompt.id) {
                    await SentPromptService.sharedInstance.deleteForPromptId(this.prompt.id)
                }
            },
            startEditing() {
                this.editedText = this.responseText || "";
                this.editedResponses = this.responses.map(response => {
                    return { id: response.id || "", text: response.content.text || "" }
                });

                if (this.editedResponses.length === 0) {
                    this.editedResponses = [{ id: undefined, text: "" }];
                }


                // this.doReflect = true;
                // this.
            },
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    button, a.button {
        align-items: center;
        display: inline-flex;
        flex-grow: 0;
        margin-right: .8rem;

        svg {
            fill: $darkGreen;
            height: 1.6rem;
            margin-right: .8rem;
            width: 1.6rem;
        }

        &.icon {
            padding: .9rem;

            svg {
                margin-right: 0;
            }
        }

        &.primary svg {
            fill: white;
        }
    }

    textarea {
        border: 1px solid $green;
        border-radius: 6px;
        font-family: $font-stack;
        font-size: 1.6rem;
        line-height: 1.43;
        margin-top: .8rem;
        min-height: 6rem;
        padding: 1.6rem;
        width: 100%;

        &:focus {
            box-shadow: 0 0 3px 2pt $darkGreen;
            outline: none;
        }
    }

    .buttonContainer {
        display: flex;
        margin-top: 1.6rem;
    }


</style>
