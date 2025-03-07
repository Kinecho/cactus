<template>
    <div class="element-icon" @click="toggleElement" :class="{selected, selectable, pulsing, withCircle, withLabel}">
        <img :src="imageUrl" :alt="`${element} Icon`" v-if="showImage"/>
        <h4 v-if="withLabel">{{element}}</h4>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import { Prop } from "vue-property-decorator";
    import { CactusElement as Element } from "@shared/models/CactusElement";

    @Component
    export default class CactusElement extends Vue {

        @Prop({ type: [String as () => Element, String], required: true })
        element?: Element

        @Prop({ type: Boolean, required: false, default: false })
        selected!: boolean;

        @Prop({ type: Boolean, required: false, default: true })
        selectable!: boolean;

        @Prop({ type: Boolean, required: false, default: false })
        withCircle!: boolean;

        @Prop({ type: Boolean, required: false, default: true })
        withLabel!: boolean;

        @Prop({ type: Boolean, required: false, default: false })
        pulsing!: boolean;

        @Prop({ type: Boolean, required: false, default: true })
        showImage!: boolean;

        toggleElement() {
            if (!this.selectable) {
                return;
            }
            this.$emit('selected', this.selected ? undefined : this.element);
        }

        get imageUrl(): string | undefined {
            if (!this.element) {
                return;
            }
            switch (this.element) {
                case Element.meaning:
                    return "/assets/images/elements/meaning.svg";
                case Element.emotions:
                    return "/assets/images/elements/emotions.svg";
                case Element.relationships:
                    return "/assets/images/elements/relationships.svg";
                case Element.experience:
                    return "/assets/images/elements/experience.svg";
                case Element.energy:
                    return "/assets/images/elements/energy.svg";
            }
        }
    }
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";

    .element-icon {
        align-items: center;
        display: flex;
        flex-direction: column;
        justify-content: center;
        position: relative;
        text-align: center;

        &.pulsing {
            &:before {
                animation: pulse-green 2s infinite;
                background: rgba(51, 217, 178, 1);
                border-radius: 50%;
                bottom: 0;
                box-shadow: 0 0 0 0 rgba(51, 217, 178, 1);
                content: "";
                height: 1px;
                left: 0;
                margin: auto;
                position: absolute;
                right: 0;
                top: 0;
                transform: scale(1);
                width: 1px;
                z-index: 0;
            }
        }

        &.selectable {
            cursor: pointer;

            img {
                position: relative;
                transition: transform .3s;
                z-index: 1;
            }

            &:hover {
                img {
                    transform: scale(1.1);
                }
            }
        }

        &.selected h4 {
            opacity: 1;
        }

        &.withCircle {
            background-color: $beige;
            border-radius: 50%;
            height: 6.4rem;
            width: 6.4rem;

            &.withLabel {
                background-color: transparent;
                height: auto;
                width: auto;

                img {
                    margin-bottom: 1.6rem;
                    z-index: 2;
                }

                h4 {
                    &:before {
                        background-color: $beige;
                        border-radius: 50%;
                        content: '';
                        height: 6.4rem;
                        left: 0;
                        margin: auto;
                        position: absolute;
                        right: 0;
                        top: -11px;
                        width: 6.4rem;

                        @include r(768) {
                            background-color: darken($beige, 5%);
                        }
                    }
                }
            }
        }
    }

    img {
        height: 4.8rem;
        width: 4.8rem;

        .withCircle &,
        .withLabel &,
        .selectable & {
            height: 4rem;
            width: 4rem;
        }
    }

    h4 {
        font-size: 1.4rem;
        font-weight: normal;
        letter-spacing: 0;
        text-transform: capitalize;

        @include r(374) {
            font-size: 1.2rem;
            font-weight: bold;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
    }
</style>
