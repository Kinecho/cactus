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
    import {getFlamelink} from '@web/firebase';
    import {getQueryParam} from '@web/util'
    import {PageRoute} from '@web/PageRoutes'


    export default Vue.extend({
        async created(): Promise<void> {
            //get content
            const flamelink = getFlamelink();

            const entryId = window.location.pathname.split(`${PageRoute.PROMPTS_ROOT}/`)[1];

            const promptsUnsubscriber = await flamelink.content.subscribe({
                entryId,
                schemaKey: "prompt",
                callback: (error: any, prompt: any) => {
                    if (error) {
                        this.loading = false;
                        return console.error("Failed to load prompts", error)
                    }
                    console.log("prompt", prompt);
                    this.prompt = prompt;
                    this.loading = false;
                }
            });


        },

        data(): { prompt: any | undefined, loading: boolean } {
            return {prompt: undefined, loading: true};
        }
    })
</script>