<template>
    <img :src="imageUrl" alt="" v-if="imageUrl"/>
</template>

<script lang="ts">
    import Vue from "vue";
    import {getFlamelink} from '@web/firebase'

    enum ImageWidth {
        w375 = "375",
        w667 = "667",
        w900 = "900",
        w1080 = "1080",
        w1440 = "1440",
        w1920 = "1920",
    }

    export default Vue.extend({
        props: {
            imageId: String,
            width: {
                type: String as () => ImageWidth,
                default: ImageWidth.w667,
            }
        },
        data(): {
            imageUrl: string | undefined
        } {
            return {
                imageUrl: undefined
            }
        }
        ,
        async created() {
            await this.fetchImageUrl();
        }
        ,
        watch: {
            async imageId() {
                await this.fetchImageUrl()
            }
        }
        ,
        methods: {
            async fetchImageUrl() {
                if (!this.imageId) {
                    this.imageUrl = undefined;
                    return;
                }
                console.log("Fetching image url for ID", this.imageId);

                this.imageUrl = await getFlamelink().storage.getURL({
                    fileId: this.imageId,
                    size: {width: this.width}
                })

            }
        }
    })
</script>