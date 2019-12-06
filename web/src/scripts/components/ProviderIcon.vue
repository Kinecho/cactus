<template>
    <img :src="imageUrl" v-if="imageUrl" class="provider-icon" :alt="providerName"/>
</template>

<script lang="ts">
    import Vue from "vue";
    import {getProviderDisplayName} from '@shared/util/StringUtil'

    export default Vue.extend({
        created() {
            switch (this.providerId) {
                case "apple.com":
                    this.imageUrl = "/assets/icons/apple.svg";
                case "google.com":
                    this.imageUrl = "/assets/icons/google_g.svg";
                    break;
                case "facebook.com":
                    this.imageUrl = "/assets/icons/facebook_f.svg";
                    break;
                case "twitter.com":
                    this.imageUrl = "/assets/icons/twitter_bird.svg";
                    break;
                default:
                    break;
            }
        },
        props: {
            providerId: String,
        },
        data(): {
            imageUrl: string | undefined,
        } {
            return {
                imageUrl: undefined,
            }
        },
        computed: {
            providerName(): string {
                return getProviderDisplayName(this.providerId);
            }
        }
    })
</script>

<style lang="scss" scoped>

    .provider-icon {
        height: 3rem;
        width: 3rem;

        svg {
            height: 100%;
            width: 100%;
        }
    }
</style>
