<template>
    <div class="prompt-content-card">
        <markdown-text :source="card.text" v-if="card.text"/>
        <div class="video-container" v-if="card.video">
            <div v-if="card.video.youtubeVideoId" class="iframe-wrapper">
                <iframe @load="youtubeVideoLoading = false"
                        width="320"
                        height="203"
                        :src="`https://www.youtube.com/embed/${card.video.youtubeVideoId}`"
                        frameborder="0"
                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen></iframe>
            </div>
            <div v-if="card.video.url">
                <video :src="card.video.url" controls></video>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import PromptContentCardViewModel from "@components/promptcontent/PromptContentCardViewModel";
    import { Prop } from "vue-property-decorator";
    import FlamelinkImage from "@components/FlamelinkImage.vue";
    import MarkdownText from "@components/MarkdownText.vue";
    import Spinner from "@components/Spinner.vue";


    @Component({
        components: {
            FlamelinkImage,
            MarkdownText,
            Spinner
        }
    })
    export default class VideoCard extends Vue {
        name = "VideoCard.vue";

        @Prop({ type: Number, required: true, default: 0 })
        index!: number;

        @Prop({ type: Object as () => PromptContentCardViewModel, required: true, })
        card!: PromptContentCardViewModel;

        youtubeVideoLoading = true;
    }
</script>

<style scoped lang="scss">
    @import "mixins";
    @import "prompts";

    .video-container {
        border-radius: 4px;
        margin-top: 4rem;
        overflow: hidden;

        .iframe-wrapper {
            position: relative;
            padding-bottom: 56.25%; //makes a 16:9 aspect ratio
            padding-top: 2.4rem;

            /*.loading {*/
            /*    position: absolute;*/
            /*    top: 0;*/
            /*    left: 0;*/
            /*    width: 100%;*/
            /*    height: 100%;*/
            /*    z-index: 1;*/
            /*    display: flex;*/
            /*    justify-content: center;*/
            /*    align-items: center;*/
            /*}*/

            iframe {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 2;
            }
        }
    }

</style>