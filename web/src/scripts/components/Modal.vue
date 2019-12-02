<template>
    <MountingPortal v-if="hasShown || show" :mountTo="target">
        <transition name="modal" v-if="show" appear>
            <div :class="['modal-mask', {show, opaque, light, dark}]">
                <div class="modal-wrapper">
                    <div class="modal-container" :class="{relative: containerPositionRelative}" role="dialog">
                        <div class="modal-header">
                            <slot name="header"></slot>
                        </div>
                        <div class="modal-body">
                            <button v-if="showCloseButton" @click="close" title="Close" class="modal-close tertiary icon" :style="closeStyles" :class='{mobileHidden: hideCloseButtonOnMobile}'>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14">
                                    <path fill="#29A389" d="M8.414 7l5.293 5.293a1 1 0 0 1-1.414 1.414L7 8.414l-5.293 5.293a1 1 0 1 1-1.414-1.414L5.586 7 .293 1.707A1 1 0 1 1 1.707.293L7 5.586 12.293.293a1 1 0 0 1 1.414 1.414L8.414 7z"/>
                                </svg>
                            </button>
                            <slot name="body">
                                default body
                            </slot>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </MountingPortal>
</template>

<script lang="ts">
    import Vue from "vue";
    import * as uuid from "uuid/v4"
    import {MountingPortal} from "portal-vue"

    export default Vue.extend({
        components: {
            MountingPortal,
        },
        props: {
            show: Boolean,
            showCloseButton: {type: Boolean, default: true},
            hideCloseButtonOnMobile: {type: Boolean, default: false},
            opaque: Boolean,
            light: {type: Boolean, default: true},
            dark: Boolean,
            closeStyles: {
                type: Object as () => { [name: string]: any }
            },
            containerPositionRelative: {
                type: Boolean,
                default: false,
            }
        },
        beforeMount() {
            this.escapeListener = (evt: KeyboardEvent) => {
                if (evt.code === "Escape" || evt.keyCode === 27) {
                    this.close()
                }
            };

            document.addEventListener('keyup', this.escapeListener);


            if (!this.id) {
                this.id = uuid()
            }

        },
        destroyed() {
            window.removeEventListener("keyup", this.escapeListener);
            if (this.key) {
                let wrapper = document.getElementById(this.key);
                if (wrapper) {
                    wrapper.remove()
                }
            }

            window.clearInterval(this.cleanupInterval);
            this.removeModal();
        },
        data(): {
            escapeListener: any,
            id?: string,
            cleanupInterval?: any,
            hasShown: boolean,
        } {
            return {
                escapeListener: undefined,
                cleanupInterval: undefined,
                hasShown: this.show,
            }
        },
        methods: {
            close() {
                this.$emit("close");
            },
            removeModal() {
                if (this.key){
                    const wrapper = document.getElementById(this.key);
                    wrapper?.remove();
                }
            }
        },
        watch: {
            show(newValue) {
                window.clearInterval(this.cleanupInterval);
                if (newValue) {
                    if (this.key){
                        let modal = document.getElementById(this.key);
                        if (!modal) {
                            const wrapper = document.createElement("div");
                            const portal = document.createElement("div");
                            portal.classList.add("portal-target");
                            wrapper.setAttribute("id", this.key);
                            wrapper.appendChild(portal);
                            document.body.appendChild(wrapper)
                        }
                    }

                    this.hasShown = true;

                    document.body.classList.add("no-scroll");
                    this.$root.$el.classList.add("modal-mask-in")
                } else {
                    document.body.classList.remove("no-scroll");
                    this.$root.$el.classList.remove("modal-mask-in");

                    //wait for a bit before removing the wrapper element so that any animations can finish.
                    this.cleanupInterval = window.setTimeout(() => {
                        this.removeModal();
                        this.hasShown = false;
                    }, 1000)

                }
            }
        },
        computed: {
            key():string|undefined{
                return this.id ? `modal_${this.id}` : undefined
            },
            target(): string|undefined {
                return this.key ? `#${this.key} > .portal-target` : undefined
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "variables";
    @import "mixins";

    .modal-mask {
        position: fixed;
        z-index: 9998;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;

        &.light {
            background-color: rgba(255, 255, 255, .6);

            &.opaque {
                background-color: rgba(255, 255, 255, .1);
            }
        }

        &.dark {
            background-color: rgba(0, 0, 0, .6);

            &.opaque {
                background-color: rgba(0, 0, 0, 1);
            }
        }


        transition: opacity .3s ease;
        overflow-y: auto;
        display: flex;
        align-items: center;
        justify-content: center;

        .modal-wrapper {
            .modal-container {
                &.relative {
                    position: relative;
                }

                margin: 0 auto;
                border-radius: 2px;
                transition: all .3s ease;

                .modal-close {
                    &.mobileHidden {
                        @include maxW(600) {
                            display: none;
                        }
                    }

                    position: absolute;
                    top: .8rem;
                    right: .8rem;

                    z-index: 100;
                    height: 4.8rem;
                    width: 4.8rem;


                    svg {
                        height: 1.8rem;
                        width: 1.8rem;
                    }
                }


                .modal-header {


                }

                .modal-body {
                    margin: 0 0;
                    position: relative;
                }


            }
        }
    }


    /*
     * The following styles are auto-applied to elements with
     * transition="modal" when their visibility is toggled
     * by Vue.js.
     *
     * You can easily play with the modal transition by editing
     * these styles.
     */

    .modal-enter {
        opacity: 0;
    }

    .modal-leave-active {
        opacity: 0;
    }

    .modal-enter .modal-container,
    .modal-leave-active .modal-container {
        transform: scale(0.8);
    }
</style>
