<template>
    <div v-if="isVisible">
        <a class="element-container" @click.prevent="showModal">
            <img :src="imageUrl" :alt="label"/>
            <h4 class="label">{{label}}</h4>
        </a>
        <element-description-modal
                :cactusElement="card.element"
                :showModal="modalVisible"
                :navigationEnabled="true"
                :showIntroCard="false"
                @close="hideModal"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import PromptContentCardViewModel from "@components/promptcontent/PromptContentCardViewModel";
    import { Prop } from "vue-property-decorator";
    import ElementDescriptionModal from "@components/ElementDescriptionModal.vue";

    @Component({
        components: {
            ElementDescriptionModal
        }
    })
    export default class CardElement extends Vue {
        name = "CardElement";

        @Prop({ type: Object as () => PromptContentCardViewModel, required: true })
        card!: PromptContentCardViewModel;

        modalVisible = false;

        get isVisible(): boolean {
            return (this.card.content.showElementIcon ?? false) && !!this.card.element;
        }

        showModal() {
            this.modalVisible = true;
        }

        hideModal() {
            this.modalVisible = false;
        }

        get label(): string | null {
            return this.card.element;
        }

        get imageUrl(): string | null {
            if (!this.card.element) {
                return null;
            }
            return `/assets/images/elements/${ this.card.element }.svg`
        }
    }
</script>

<style scoped lang="scss">
    @import "variables";

    .element-container {
        cursor: pointer;
        text-align: center;
        display: inline-block;
    }

    .label {
        color: $darkestGreen;
        margin-bottom: 1.6rem;
    }
</style>