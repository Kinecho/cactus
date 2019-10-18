<template>
    <modal :show="showContent"
            v-on:close="showContent = false; $emit('close')"
            :showCloseButton="true"
    >

        <transition-group class="modalContainer" tag="div" slot="body">
            <div v-for="slide in slides" class="slide" :key="slide.id">
                <div class="slideContent">
                    <div v-show="slide.element" class="elementIcon">
                        <img :src="'/assets/images/cacti/'+ slide.element + '-3.svg'"/>
                    </div>
                    <h3 v-show="slide.element">{{slide.element}}</h3>
                    <p class="description">{{slide.element ? elementCopy[slide.element.toUpperCase() + '_DESCRIPTION'] : slide.intro}}</p>
                </div>
                <div class="btnContainer">
                    <button class="tertiary icon left" @click="previous">
                        <svg class="arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18">
                            <path fill="#29A389" d="M12.586 7L7.293 1.707A1 1 0 0 1 8.707.293l7 7a1 1 0 0 1 0 1.414l-7 7a1 1 0 1 1-1.414-1.414L12.586 9H1a1 1 0 1 1 0-2h11.586z"/>
                        </svg>
                    </button>
                    <button class="tertiary icon right" @click="next">
                        <svg class="arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18">
                            <path fill="#29A389" d="M12.586 7L7.293 1.707A1 1 0 0 1 8.707.293l7 7a1 1 0 0 1 0 1.414l-7 7a1 1 0 1 1-1.414-1.414L12.586 9H1a1 1 0 1 1 0-2h11.586z"/>
                        </svg>
                    </button>
                </div>
            </div>
        </transition-group>
    </modal>
</template>

<script lang="ts">
    import Vue from "vue";
    import Modal from "@components/Modal.vue";
    import {CactusElement} from "@shared/models/CactusElement";
    import CopyService from '@shared/copy/CopyService';
    import {ElementCopy} from '@shared/copy/CopyTypes';

    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
        components: {
            Modal,
        },
        props: {
            cactusElement: String,
            autoLoad: Boolean,
        },
        data(): {
            showContent: boolean,
            elementCopy: ElementCopy,
            slides: Array<any>,
        } {
            return {
                showContent: this.autoLoad,
                elementCopy: copy.elements,
                slides: [
                    {
                        id: 0,
                        intro: "Your happiest life depends on a balance of five elements."
                    }, {
                        id: 1,
                        element: "energy"
                    }, {
                        id: 2,
                        element: "meaning"
                    }, {
                        id: 3,
                        element: "relationships"
                    }, {
                        id: 4,
                        element: "experience"
                    }, {
                        id: 5,
                        element: "emotions"
                    }
                ]
            }
        },
        watch: {
            autoLoad: function () {
              this.showContent = this.autoLoad
            }
        },
        methods: {
            next () {
                const first = this.slides.shift()
                this.slides = this.slides.concat(first)
            },
            previous () {
                const last = this.slides.pop()
                this.slides = [last].concat(this.slides)
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .elementIcon {
        align-items: center;
        background-color: $lightPink;
        border-radius: 50%;
        display: inline-flex;
        height: 6.4rem;
        justify-content: center;
        margin-bottom: 1.6rem;
        padding: .4rem;
        width: 6.4rem;

        img {
            $avatarSize: 5.6rem;
            height: $avatarSize;
            width: $avatarSize;
        }
    }

    .modalContainer {
        background-color: $darkestGreen;
        border-radius: 1.2rem;
        color: $lightGreen;
        display: flex;
        min-height: 34rem;
        overflow: hidden;
        width: 30rem;
    }

    .slide {
        align-items: center;
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        justify-content: space-between;
        padding: 4rem 2.4rem 2.4rem;
        width: 30rem;
    }

    .slideContent {
        align-items: center;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        justify-content: center;
    }

    h3 {
        color: $white;
        text-transform: capitalize;
    }

    .description {
        align-items: center;
        display: flex;
    }

    .btnContainer {
        display: flex;
    }

    button.left {
        margin: -2px 1.6rem 0 0;
        transform: scale(-1);
    }

    .arrow {
        height: 1.8rem;
        width: 1.8rem;
    }

</style>
