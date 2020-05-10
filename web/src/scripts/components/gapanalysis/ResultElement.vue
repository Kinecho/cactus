<template>
    <div class="element-icon" @click="toggleElement" :class="{selected, selectable, withCircle}">
        <img :src="imageUrl" :alt="`${element} Icon`"/>
        <h4>{{element}}</h4>
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
                    return "/assets/images/cacti/meaniningGrow.svg";
                case Element.emotions:
                    return "/assets/images/cacti/emotionsGrow.svg";
                case Element.relationships:
                    return "/assets/images/cacti/relationshipsGrow.svg";
                case Element.experience:
                    return "/assets/images/cacti/experienceGrow.svg";
                case Element.energy:
                    return "/assets/images/cacti/energy-3.svg";
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
        transition: all .3s linear;

        &.withCircle {
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

        img {
            width: 4rem;
            height: 4rem;
        }

        // &.selectable {
        //     opacity: .5;
        // }
        //
        // &.selected.selectable {
        //     opacity: 1;
        // }
        //
        // &.selectable:hover {
        //     opacity: 1;
        // }
    }

    h4 {
        font-size: 1.4rem;
    }
</style>
