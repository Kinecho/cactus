<template>
    <div class="prompt-content-card">
        <span>Photo</span>
        <markdown-text :source="card.text" v-if="card.text"/>
        <div class="photo-container" v-if="card.photo">
            <flamelink-image :image="card.photo"/>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import PromptContentCardViewModel from "@components/promptcontent/PromptContentCardViewModel";
    import { Prop } from "vue-property-decorator";
    import FlamelinkImage from "@components/FlamelinkImage.vue";

    @Component({
        components: {
            FlamelinkImage,
        }
    })
    export default class PhotoCard extends Vue {
        name = "PhotoCard.vue";

        @Prop({ type: Number, required: true, default: 0 })
        index!: number;

        @Prop({ type: Object as () => PromptContentCardViewModel, required: true, })
        card!: PromptContentCardViewModel;

    }
</script>

<style scoped lang="scss">
    @import "mixins";

    .prompt-content-card {
        padding: 4rem 2.4rem;

        @include r(374) {
            //do not add margin: auto here as it makes the cards jumpy
            padding: 5.6rem 3.2rem;
            width: 100%;
        }
    }

    .photo-container {
        margin-top: 4rem;

        img {
            border-radius: 4px;
            display: block;
            max-width: 100%;
            margin: 0 auto; /* center smaller image in card */
        }
    }
</style>