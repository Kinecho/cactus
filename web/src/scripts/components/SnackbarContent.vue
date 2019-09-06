<template>
    <transition name="snack" appear>
        <div class="snackbar snackbar-content" v-if="!hidden" :class="[{closeable}]">
            <span class="icon" v-if="$slots.icon">
                <slot name="icon"></slot>
            </span>
            <slot name="text">{{text}}</slot>
            <button title="Close" class="close tertiary icon" @click="dismiss" v-if="closeable">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14">
                    <path fill="#e6f9f7" d="M8.414 7l5.293 5.293a1 1 0 0 1-1.414 1.414L7 8.414l-5.293 5.293a1 1 0 1 1-1.414-1.414L5.586 7 .293 1.707A1 1 0 1 1 1.707.293L7 5.586 12.293.293a1 1 0 0 1 1.414 1.414L8.414 7z"/>
                </svg>
            </button>
        </div>
    </transition>


</template>

<script lang="ts">
    import Vue from "vue";

    const DEFAULT_DURATION_MS = 5000;
    export default Vue.extend({
        created() {

        },
        props: {
            text: String,
            autoHide: {type: Boolean, default: false},
            durationMs: {type: Number, default: DEFAULT_DURATION_MS},
            closeable: {type: Boolean, default: true},
        },
        data(): {
            hideTimer: any | undefined,
            timedOut: boolean,
            dismissed: boolean,
        } {
            return {
                hideTimer: undefined,
                timedOut: false,
                dismissed: false,
            }
        },
        beforeMount() {
            if (this.autoHide) {
                this.hideTimer = setTimeout(() => {
                    this.timedOut = true;
                }, this.durationMs || DEFAULT_DURATION_MS)
            }
        },
        destroyed() {
            if (this.hideTimer) {
                clearInterval(this.hideTimer);
            }
        },
        computed: {
            hidden(): boolean {
                return this.timedOut || this.dismissed;
            }
        },

        methods: {
            dismiss() {
                this.dismissed = true;
            }
        },

    })
</script>

<style lang="scss">
    @import "common";
    @import "mixins";
    @import "variables";
    @import "transitions";

    .snackbar-content {
        $topPadding: 2rem;
        padding: $topPadding 2rem;
        background-color: $darkestGreen;
        color: $lightBlue;
        border-radius: 12px;
        position: relative;
        display: flex;
        align-items: center;
        min-height: 2rem;

        .icon {
            display: flex;
            align-items: center;
            margin-right: 1rem;

            svg {
                height: 2rem;
                width: 2rem;

                path {
                    fill: $lightBlue;
                }

            }
        }

        &.closeable {
            padding-right: 5rem;
        }

        .close {
            $closeHeight: 1.5rem;
            position: absolute;
            right: 0;
            top: $topPadding - $closeHeight/2;

            svg {
                height: $closeHeight;
                width: $closeHeight;

                path {
                    fill: $green;
                }
            }
        }
    }


    .snack {
        &-enter-active {
            transition: all .2s cubic-bezier(.42, .97, .52, 1.49)
        }

        &-leave-active {
            transition: all .2s ease;
        }

        &-enter {
            opacity: 0;
            transform: translateY(15px);
        }

        &-leave-to {
            opacity: 0;
            transform: translateX(-50px);
        }
    }

</style>
