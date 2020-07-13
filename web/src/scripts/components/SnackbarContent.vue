<template>
    <div class="snackbar snackbar-content" v-if="!hidden" :class="[color, {closeable}]">
            <span class="check" v-if="$slots.icon">
                <slot name="icon"></slot>
            </span>
        <slot name="text">{{text}}</slot>
        <button title="Close" class="close tertiary" @click="dismiss" v-if="closeable">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14">
                <path fill="#e6f9f7" d="M8.414 7l5.293 5.293a1 1 0 0 1-1.414 1.414L7 8.414l-5.293 5.293a1 1 0 1 1-1.414-1.414L5.586 7 .293 1.707A1 1 0 1 1 1.707.293L7 5.586 12.293.293a1 1 0 0 1 1.414 1.414L8.414 7z"/>
            </svg>
        </button>
        <slot name="action">{{action}}</slot>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import { DEFAULT_DURATION_MS } from "@components/SnackbarContentTypes";

    export default Vue.extend({
        created() {

        },
        props: {
            text: String,
            action: {type: String, required: false},
            autoHide: {type: Boolean, default: false},
            durationMs: {type: Number, default: DEFAULT_DURATION_MS},
            closeable: {type: Boolean, default: true},
            color: {
                default: "default",
                required: false,
                validator: function (value: string) {
                    // The value must match one of these strings
                    return ['success', 'warning', 'danger', "info", "default", "successAlt", "dolphin"].indexOf(value) !== -1
                }
            }
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
                    this.remove();
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
        watch: {
            autoHide(autoHide: boolean) {
                if (this.hideTimer) {
                    clearInterval(this.hideTimer);
                }
                if (autoHide) {
                    this.hideTimer = setTimeout(() => {
                        this.timedOut = true;
                        this.remove();
                    }, this.durationMs || DEFAULT_DURATION_MS)
                }
            }
        },
        methods: {
            remove() {
                this.$emit("close")
            },
            dismiss() {
                this.dismissed = true;
                this.remove();
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
        align-items: center;
        background-color: $darkestGreen;
        color: $lightGreen;
        border-radius: 6px;
        display: inline-flex;
        margin-bottom: 1.6rem;
        padding: .8rem 1.6rem;
        position: relative;
        transition: all .3s;

        &.default {
            background-color: $darkestGreen;
            color: $lightBlue;
        }

        &.success {
            background-color: $darkGreen;
            color: $white;
        }

        &.successAlt {
            background: $darkerGreen url(/assets/images/grainy.png) repeat;
            color: $white;
        }

        &.dolphin {
            background-color: $dolphin;
            color: $white;
        }

        &.danger {
            background-color: $darkestPink;
            color: $white;
        }

        &.info {
            background-color: $darkestGreen;
            color: $lightBlue;
        }

        &.warning {
            background-color: $darkestYellow;
            color: $darkText;
        }

        &.closeable {
            padding-right: 4.8rem;
        }

        .check svg {
            height: 1.1rem;
            margin-right: .8rem;
            width: 1.6rem;

            path {
                fill: $lightGreen;
            }
        }

        .close {
            padding: 1rem 1.6rem;
            position: absolute;
            right: 0;
            top: 0;

            svg {
                $closeHeight: 1.5rem;
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
            transform: translateX(-150px);
        }
    }

</style>
