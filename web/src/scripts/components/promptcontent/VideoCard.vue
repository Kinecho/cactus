<template>
    <div class="prompt-content-card">
        <div class="video-card">
            <div class="video-container" v-if="card.video">
                <div v-if="card.video.youtubeVideoId" class="iframe-wrapper">
                    <spinner v-if="youtubeVideoLoading" message="Loading video..."/>
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
            <div class="caption" v-if="card.text">
                <markdown-text :source="card.text"/>
            </div>
            <div class="actions">
                <slot name="actions"/>
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

    .video-card {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 80vh;
        padding: 0 .8rem;
        flex: 1;
        @include r(374) {
            justify-content: center;
            margin: 0 auto;
            max-width: 48rem;
            padding: 0 2.4rem;
        }
        @include r(768) {
            max-width: 64rem;
            min-height: 0;
        }
        @include r(960) {
            align-items: center;
            flex-direction: row;
            justify-content: flex-start;
            max-width: none;
            padding: 0 6.4rem;
        }
    }

    .video-container {
        border-radius: .4rem;
        margin: 4rem 1.6rem 1.6rem;
        overflow: hidden;
        width: 100%;
        flex: 1;

        @include r(768) {
            margin: 0 0 1.6rem;
        }

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

    .actions {
        @include r(600) {
            justify-content: center;
        }
    }

</style>