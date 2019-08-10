<template>

    <div>
        <h1>Hello!</h1>
        <div v-if="loading">Loading</div>
        <div v-if="!loading">
            some content:
            {{prompt.question}}
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {getFlamelink} from '@web/firebase';
    import {getQueryParam} from '@web/util'


    export default Vue.extend({
        async created(): Promise<void> {
            //get content
            const flamelink = getFlamelink();

            const entryId = "NtCjgJiz2dAfraoEFzkU";

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