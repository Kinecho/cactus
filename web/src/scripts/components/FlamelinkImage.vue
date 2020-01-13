<template>
    <img :src="imageUrl" :alt="altText" v-if="imageUrl"/>
</template>

<script lang="ts">
    import Vue from "vue";
    import {getFlamelink} from '@web/firebase'
    import {Image as ContentImage} from "@shared/models/PromptContent";
    import {Config} from '@web/config'
    import {getCloudinaryUrlFromStorageUrl, getImageBreakpointWidth, ImageWidth} from '@shared/util/ImageUtil'
    import Logger from "@shared/Logger";

    const logger = new Logger("FlamelinkImage.vue");
    
    export default Vue.extend({
        props: {
            image: {
                type: Object as () => ContentImage
            },
            width: {
                type: [String as () => ImageWidth | string, Number],
                default: ImageWidth.w667,
            }
        },
        data(): {
            imageUrl: string | undefined
        } {
            return {
                imageUrl: undefined
            }
        },
        async created() {
            await this.fetchImageUrl();
        },
        watch: {
            async imageId() {
                await this.fetchImageUrl()
            }
        },
        computed: {
            altText(): string {
                return this.image.altText || ''
            }
        },
        methods: {
            async fetchImageUrl(): Promise<void> {
                if (!this.image) {
                    this.imageUrl = undefined;
                    return;
                }

                if (this.image.flamelinkFileName) {
                    const storagePath = `flamelink/media/${this.image.flamelinkFileName}`;
                    const storageUrl = `https://firebasestorage.googleapis.com/v0/b/${Config.firebase.storageBucket}/o/${encodeURIComponent(storagePath)}?alt=media`;
                    this.imageUrl = getCloudinaryUrlFromStorageUrl({
                            storageUrl: storageUrl, 
                            width: this.width
                        });
                    return;
                }

                if (this.image.storageUrl) {
                    this.imageUrl = getCloudinaryUrlFromStorageUrl({
                            storageUrl: this.image.storageUrl, 
                            width: this.width
                        });
                    return;
                }

                if (this.image.url) {
                    this.imageUrl = this.image.url;
                    return
                }

                if (this.image.fileIds && this.image.fileIds.length > 0) {
                    const [imageId] = this.image.fileIds;
                    logger.log("Fetching image url for ID", imageId);

                    this.imageUrl = await getFlamelink().storage.getURL({
                        fileId: imageId,
                        size: {width: getImageBreakpointWidth(this.width)}
                    });
                    return;
                }
            }
        }
    })
</script>