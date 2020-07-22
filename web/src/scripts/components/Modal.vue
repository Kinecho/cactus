<template>
    <MountingPortal v-if="portalReady && (hasShown || show) " :mountTo="target" :name="id">
        <transition name="modal" v-if="show" appear>
            <div :class="['modal-mask', {show, opaque, light, dark, tall, fullScreen}]">
                <div class="modal-container" :class="{relative: containerPositionRelative}"
                        role="dialog"
                >
                    <div class="modal-header" v-if="!!$slots.header">
                        <slot name="header"></slot>
                    </div>
                    <div class="modal-body">
                        <button v-if="showCloseButton" @click="close" title="Close" class="modal-close tertiary icon" :style="closeStyles" :class='{mobileHidden: hideCloseButtonOnMobile}'>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14">
                                <path fill="#29A389" d="M8.414 7l5.293 5.293a1 1 0 0 1-1.414 1.414L7 8.414l-5.293 5.293a1 1 0 1 1-1.414-1.414L5.586 7 .293 1.707A1 1 0 1 1 1.707.293L7 5.586 12.293.293a1 1 0 0 1 1.414 1.414L8.414 7z"/>
                            </svg>
                        </button>
                        <div class="content-body" v-if="!!$slots.body">
                            <slot name="body"></slot>
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
    import { MountingPortal } from "portal-vue"
    import Logger from "@shared/Logger"
    import Component from "vue-class-component";
    import { Prop, Watch } from "vue-property-decorator";

    const logger = new Logger("Modal");
    @Component(
    {
        components: {
            MountingPortal,
        }
    })
    export default class Modal extends Vue {
        @Prop({ type: Boolean, default: false })
        show!: boolean

        @Prop({ type: Boolean, default: true })
        showCloseButton!: boolean;

        @Prop({ type: Boolean, default: false })
        hideCloseButtonOnMobile!: boolean;

        @Prop({ type: Boolean, default: false })
        opaque!: boolean;

        @Prop({ type: Boolean, default: true })
        light!: boolean;

        @Prop({ type: Boolean, default: false })
        dark!: boolean;

        @Prop({ type: Object as () => Record<string, any>, default: null })
        closeStyles!: Record<string, any> | null;

        @Prop({ type: Boolean, default: false })
        tall!: boolean;

        @Prop({ type: Boolean, default: false })
        containerPositionRelative!: boolean;

        @Prop({ type: Boolean, default: false })
        fullScreen!: boolean;

        @Prop({ type: String, required: false, default: uuid() })
        id!: string;

        escapeListener: any = undefined;
        cleanupInterval: any = undefined;
        hasShown: boolean = this.show;
        scrollPosition: number = 0;

        portalReady: boolean = false;

        //END props
        beforeMount() {
            this.escapeListener = (evt: KeyboardEvent) => {
                if (evt.code === "Escape" || evt.keyCode === 27) {
                    this.close()
                }
            };
            document.addEventListener('keyup', this.escapeListener);

            const wrapper = document.getElementById(this.key);
            wrapper?.remove();
        }

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
            this.removeStyles();
        }

        close() {
            this.$emit("close");
        }

        addStyles() {
            try {
                const scrollPosition = window.pageYOffset;
                const isNoScroll = document.body.classList.contains("no-scroll");
                document.body.classList.add("no-scroll");
                this.$root.$children[0]?.$el?.classList?.add("modal-mask-in")
                if (!isNoScroll) {
                    this.scrollPosition = scrollPosition;
                    logger.info("setting scroll position to", scrollPosition);
                    document.body.style.top = `-${ scrollPosition }px`;
                }

            } catch (error) {
                logger.error("Failed to add modal-mask-in on app root", error)
            }
        }

        removeStyles() {
            try {
                const isNoScroll = document.body.classList.contains("no-scroll");

                document.body.classList.remove("no-scroll");
                this.$root.$children[0]?.$el?.classList?.remove("modal-mask-in");
                document.body.style.removeProperty('top');
                if (isNoScroll) {
                    logger.info("Scrolling to", this.scrollPosition);
                    window.scrollTo(0, this.scrollPosition);
                }
            } catch (error) {
                logger.error("failed to remove modal-mask-in class from the app root", error);
            }
        }

        removeModal() {
            const wrapper = document.getElementById(this.key);
            wrapper?.remove();
            this.portalReady = false;
        }

        @Watch("show")
        onShow(newValue: boolean) {
            window.clearInterval(this.cleanupInterval);
            this.hasShown = newValue || this.hasShown;
            if (newValue) {
                if (this.key) {
                    let modal = document.getElementById(this.key);
                    if (!modal) {
                        const wrapper = document.createElement("div");
                        const portal = document.createElement("div");
                        portal.classList.add("portal-target");
                        wrapper.setAttribute("id", this.key);
                        wrapper.appendChild(portal);
                        document.body.appendChild(wrapper)
                        this.portalReady = true;
                    }
                }

                this.hasShown = true;
                this.addStyles()

            } else {
                this.removeStyles()

                //wait for a bit before removing the wrapper element so that any animations can finish.
                this.cleanupInterval = window.setTimeout(() => {
                    this.removeModal();
                    this.hasShown = false;
                }, 1000)

            }
        }

        get key(): string {
            return `modal_${ this.id }`
        }

        get target(): string {
            return `#${ this.key } > .portal-target`
        }
    }

</script>

<style lang="scss" scoped>
    @import "common";
    @import "variables";
    @import "mixins";

    .modal-mask {
        align-items: center;
        display: flex;
        justify-content: center;
        position: fixed;
        left: 0;
        top: 0;
        height: 100%;
        width: 100%;
        overflow-y: auto;
        transition: opacity .3s ease;
        z-index: $z-modal;

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

        &.tall {
            display: block;

            @include h(960) {
                align-items: center;
                display: flex;
                justify-content: center;
            }
        }

        &.fullScreen {

            .modal-container {
                height: 100%;
                width: 100%;
            }

            .modal-body {
                display: flex;
                height: 100%;
            }

            .content-body {
                width: 100%;
            }
        }

        .modal-container {
            margin: 0 auto;
            border-radius: 2px;
            transition: all .3s ease;
            max-height: 100%;
            overflow: auto;

            &.relative {
                position: relative;
            }

            .modal-close {
                position: absolute;
                top: .8rem;
                right: .8rem;
                z-index: 100;
                height: 4.8rem;
                width: 4.8rem;

                @include r(600) {
                    position: absolute;
                }

                &.mobileHidden {
                    @include maxW(600) {
                        display: none;
                    }
                }

                svg {
                    height: 1.8rem;
                    width: 1.8rem;
                }
            }

            .modal-body {
                margin: 0 0;
                position: relative;
                overflow: auto;
                max-height: 100%;
            }

            .content-body {

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
