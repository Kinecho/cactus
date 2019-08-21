<template>
    <img :src="imageUrl" alt="" v-if="imageUrl"/>
</template>

<script lang="ts">
    import Vue from "vue";
    import {getFlamelink} from '@web/firebase'
    import {Image as ContentImage} from "@shared/models/PromptContent";
    import {Config} from '@web/config'
    import {stripQueryParams} from '@shared/util/StringUtil'
    import {getImageBreakpointWidth, ImageWidth} from '@shared/util/ImageUtil'

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
        methods: {

            getCloudinaryUrlFromStorageUrl(storageUrl: string): string {

                const isSVG = stripQueryParams(storageUrl).url.endsWith(".svg");
                let transformations = [];
                if (!isSVG) {
                    transformations.push(`w_${getImageBreakpointWidth(this.width)}`);
                }
                let manipulationSlug = "";
                if (transformations.length > 0) {
                    manipulationSlug = `${transformations.join(",")}/`
                }

                return `https://res.cloudinary.com/cactus-app/image/fetch/${manipulationSlug}${encodeURIComponent(storageUrl)}`;
            },
            async fetchImageUrl(): Promise<void> {
                if (!this.image) {
                    this.imageUrl = undefined;
                    return;
                }

                if (this.image.flamelinkFileName) {
                    const storagePath = `flamelink/media/${this.image.flamelinkFileName}`;
                    const storageUrl = `https://firebasestorage.googleapis.com/v0/b/${Config.firebase.storageBucket}/o/${encodeURIComponent(storagePath)}?alt=media`;
                    this.imageUrl = this.getCloudinaryUrlFromStorageUrl(storageUrl);
                    return;
                }

                if (this.image.storageUrl) {
                    this.imageUrl = this.getCloudinaryUrlFromStorageUrl(this.image.storageUrl);
                    return;
                }

                if (this.image.url) {
                    this.imageUrl = this.image.url;
                    return
                }

                if (this.image.fileIds && this.image.fileIds.length > 0) {
                    const [imageId] = this.image.fileIds;
                    console.log("Fetching image url for ID", imageId);

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