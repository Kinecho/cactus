<template>
    <modal :show="showModal"
            v-on:close="$emit('close')"
            :showCloseButton="true"
    >
        <div slot="body" class="modalContainer">
            <div class="slide">
                <div class="slideContent">
                    <div v-show="slide.element" class="elementIcon">
                        <img :src="'/assets/images/cacti/'+ slide.element + '-3.svg'"/>
                    </div>
                    <h3 v-show="slide.element">{{slide.element}}</h3>
                    <p class="description" v-if="slide.element">
                        {{elementCopy[slide.element.toUpperCase() + '_DESCRIPTION']}}
                    </p>
                    <p class="description" v-else-if="slide.intro">
                        {{slide.intro}}
                    </p>
                </div>
                <div class="btnContainer" v-if="navigationEnabled">
                    <button class="tertiary icon left no-loading" :class="{disabled: !hasPrevious}" @click="previous" :disabled="!hasPrevious">
                        <svg class="arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18">
                            <path fill="#29A389" d="M12.586 7L7.293 1.707A1 1 0 0 1 8.707.293l7 7a1 1 0 0 1 0 1.414l-7 7a1 1 0 1 1-1.414-1.414L12.586 9H1a1 1 0 1 1 0-2h11.586z"/>
                        </svg>
                    </button>
                    <button class="tertiary icon right no-loading" :class="{disabled: !hasNext}" @click="next" :disabled="!hasNext">
                        <svg class="arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18">
                            <path fill="#29A389" d="M12.586 7L7.293 1.707A1 1 0 0 1 8.707.293l7 7a1 1 0 0 1 0 1.414l-7 7a1 1 0 1 1-1.414-1.414L12.586 9H1a1 1 0 1 1 0-2h11.586z"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </modal>
</template>

<script lang="ts">
    import Vue from "vue";
    import Modal from "@components/Modal.vue";
    import {CactusElement} from "@shared/models/CactusElement";
    import CopyService from '@shared/copy/CopyService';
    import {ElementCopy} from '@shared/copy/CopyTypes';

    const copy = CopyService.getSharedInstance().copy;

    interface ElementSlide {
        element?: CactusElement,
        intro?: string
    }

    export default Vue.extend({
        components: {
            Modal,
        },
        props: {
            cactusElement: {type: String as () => CactusElement},
            showModal: {type: Boolean, default: false},
            navigationEnabled: {type: Boolean, default: true},
            showIntroCard: {type: Boolean, default: true},
        },
        beforeMount() {
            this.slides = this.slides.filter(s => !s.intro || this.showIntroCard);
            this.activeIndex = Math.max(this.slides.findIndex(slide => slide.element === this.cactusElement), 0)
        },
        data(): {
            elementCopy: ElementCopy,
            slides: ElementSlide[],
            activeIndex: number,
        } {
            return {
                elementCopy: copy.elements,
                activeIndex: 0,
                slides: [
                    {
                        // id: 0,
                        intro: "Your happiest life depends on a balance of five elements."
                    }, {
                        // id: 1,
                        element: CactusElement.energy
                    }, {
                        // id: 2,
                        element: CactusElement.meaning
                    }, {
                        // id: 3,
                        element: CactusElement.relationships
                    }, {
                        // id: 4,
                        element: CactusElement.experience
                    }, {
                        // id: 5,
                        element: CactusElement.emotions
                    }
                ]
            }
        },
        computed: {
            slide(): ElementSlide {
                return this.slides[this.activeIndex]
            },
            hasNext(): boolean {
                return this.activeIndex < this.slides.length - 1
            },
            hasPrevious(): boolean {
                return this.activeIndex > 0
            }

        },
        watch: {
            cactusElement: function() {
                const foundIndex = this.slides.findIndex(slide => slide.element === this.cactusElement);
                if (foundIndex > -1){
                    this.activeIndex = Math.max(foundIndex, 0)
                }
            }
        },
        methods: {
            next() {
                this.activeIndex = Math.min(this.slides.length - 1, this.activeIndex + 1)
            },
            previous() {
                this.activeIndex = Math.max(0, this.activeIndex - 1)
            },
            cactusElementExists() {
                let exists = false;
                let element = this.cactusElement;
                this.slides.forEach(function (slide, index) {
                    if (slide.element && slide.element == element) {
                        exists = true;
                    }
                });
                return exists;
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
        opacity: 1;
        button.disabled {
            opacity: 0;
            transition: opacity .1s;
        }
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
