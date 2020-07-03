<template>
    <div class="prompt-content-card">
        <p>Reflect {{index}} - {{card.type}}</p>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import PromptContentCardViewModel from "@components/promptcontent/PromptContentCardViewModel";
    import { Prop } from "vue-property-decorator";

    @Component
    export default class ReflectCard extends Vue {
        name = "ReflectCard.vue";

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
</style>