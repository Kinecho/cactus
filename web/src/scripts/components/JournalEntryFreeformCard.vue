<template>
    <div class="journalEntry" v-bind:class="{new: !this.responseText, isDone: this.responseText, hasNote: this.responseText}">
        <p class="date" v-if="promptDate">{{promptDate}}</p>
        <div class="menuParent">
            <dropdown-menu :items="linkItems"/>
        </div>

        <h3 class="question">{{questionText}}</h3>
        <p v-show="!prompt && !isLoading" class="warning prompt">
            Oops! We were unable to load the question for this day.
        </p>

        <div class="entry" v-if="responseText">{{responseText}}</div>

        <compose-modal :prompt="prompt"
                :reflection="response"
                :member="member"
                :show="editing"
                @close="editing = false"
                @saved="onSave"
        />

    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import JournalEntry from "@web/datasource/models/JournalEntry";
    import { Prop } from "vue-property-decorator";
    import ReflectionResponse from "@shared/models/ReflectionResponse";
    import ReflectionPrompt from "@shared/models/ReflectionPrompt";
    import { DropdownMenuLink } from "@components/DropdownMenuTypes";
    import ComposeModal from "@components/freeform/ComposeModal.vue";
    import CactusMember from "@shared/models/CactusMember";
    import { FreeFormSaveEvent } from "@web/managers/ReflectionManagerTypes";
    import Logger from "@shared/Logger"
    import DropdownMenu from "@components/DropdownMenu.vue";
    import { formatDate } from "@shared/util/DateUtil";
    import CopyService from "@shared/copy/CopyService";

    const logger = new Logger("JournalEntryFreeformCard");
    const copy = CopyService.getSharedInstance().copy;

    @Component({
        components: {
            ComposeModal,
            DropdownMenu,
        }
    })
    export default class JournalEntryFreeformCard extends Vue {
        name = "JournalEntryFreeformCard";

        @Prop({ type: Object as () => JournalEntry, required: true })
        entry!: JournalEntry;

        @Prop({ type: Object as () => CactusMember, required: true })
        member!: CactusMember;

        editing = false;

        get promptDate(): string | null {
            if (this.prompt?.createdAt) {
                return formatDate(this.prompt.createdAt, copy.settings.dates.longFormat) ?? null;
            }
            return null;
        }

        get isLoading(): boolean {
            return !this.entry.allLoaded;
        }

        get questionText(): string | null {
            return this.prompt?.question ?? null;
        }

        get promptLoaded(): boolean {
            return this.entry.promptLoaded
        }

        get prompt(): ReflectionPrompt | null {
            return this.entry.prompt ?? null;
        }

        get response(): ReflectionResponse | null {
            return this.entry.responses?.[0] ?? null;
        }

        get responseText(): string | null {
            return this.response?.content.text ?? null;
        }

        get linkItems(): DropdownMenuLink[] {
            return [{
                title: "Edit",
                onClick: () => {
                    this.editing = true;
                }
            }]
        }

        async onSave(event: FreeFormSaveEvent) {
            logger.info("Saved freeform from journal feed", event)
        }
    }
</script>

<style scoped lang="scss">
    @import "mixins";
    @import "variables";
    @import "journal";

</style>