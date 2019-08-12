import {ContentButtonAction} from '@shared/models/PromptContent'
import {ScreenType} from '@shared/models/PromptContent'
import {ContentImagePosition} from '@shared/models/PromptContent'
<template>

    <div>
        <h1>Hello!</h1>
        <div v-if="loading">Loading</div>
        <div v-if="!loading && this.prompt">
            some content:
            {{prompt.question}}
        </div>
        <div v-if="!loading && !prompt">
            No prompt found for id
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {PageRoute} from '@web/PageRoutes'
    import PromptContent, {ContentButtonAction, ContentImagePosition, ContentType} from '@shared/models/PromptContent'


    export default Vue.extend({
        async created(): Promise<void> {
            //get content

            const entryId = window.location.pathname.split(`${PageRoute.PROMPTS_ROOT}/`)[1];

            const mockPrompt = new PromptContent();
            mockPrompt.id = "fake_id";
            mockPrompt.promptId = entryId;
            mockPrompt.content = [
                {
                    contentType: ContentType.content,
                    label: "Day 1 of 4 about nature",
                    text: "Today you'll reflect on your facorite thing ot do on a sunny day.",
                    backgroundImage: {
                        position: ContentImagePosition.bottom,
                        image: {
                            url: "/assets/images/celebrate.svg",
                        },
                    },
                    actionButton: {
                        action: ContentButtonAction.next,
                        label: "Let's go"
                    }
                },

            ];


            setTimeout(() => {
                this.prompt = prompt;
                this.loading = false;
            }, 1500)



        },

        data(): { prompt: any | undefined, loading: boolean } {
            return {prompt: undefined, loading: true};
        }
    })
</script>