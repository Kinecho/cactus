<template>
    <div v-if="isVisible" :class="stacked ? 'stacked' : 'inline'">
        <a class="element-container" @click.prevent="showModal">
            <ElementAnimation :element="card.element" v-if="animated"/>
            <img class="elementSvg" :src="imageUrl" :alt="label" v-else/>
            <h4 class="label" v-if="showLabel">{{label}}</h4>
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
    import ElementAnimation from "@components/elements/animations/ElementAnimation.vue";


    @Component({
        components: {
            ElementDescriptionModal,
            ElementAnimation,
        }
    })
    export default class CardElement extends Vue {
        name = "CardElement";

        @Prop({ type: Object as () => PromptContentCardViewModel, required: true })
        card!: PromptContentCardViewModel;

        @Prop({ type: Boolean, default: false })
        animated!: boolean;

        @Prop({ type: Boolean, default: true })
        stacked!: boolean;

        @Prop({ type: Boolean, default: true })
        showLabel!: boolean;

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

        .stacked & {
            text-align: center;
            display: inline-block;
        }

        .inline & {
            align-items: center;
            display: flex;
            margin-bottom: 1.6rem;
        }
    }

    .elementSvg {
        .inline & {
            height: 4rem;
            width: 4rem;
        }
    }

    .label {
        color: $darkestGreen;

        .stacked & {
            margin-bottom: 1.6rem;
        }
    }
</style>