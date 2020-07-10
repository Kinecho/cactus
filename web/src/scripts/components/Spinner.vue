<template>
    <transition name="fade-in" appear v-if="visible">
        <div class="spinner-container">
            <span class="spinner" :class="[color]">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
                    <path fill="#444" d="M10,19.945625 C7.32875,19.945625 4.8175,18.905625 2.92875,17.016875 C1.04,15.128125 0,12.616875 0,9.945625 C0,8.054375 0.530625,6.2125 1.535,4.619375 C2.511875,3.070625 3.891875,1.819375 5.52625,1 L6.36625,2.67625 C5.0375,3.341875 3.915,4.359375 3.12125,5.61875 C2.305625,6.911875 1.875,8.4075 1.875,9.945 C1.875,14.425 5.52,18.07 10,18.07 C14.48,18.07 18.125,14.425 18.125,9.945 C18.125,8.408125 17.69375,6.911875 16.87875,5.61875 C16.084375,4.359375 14.9625,3.341875 13.63375,2.67625 L14.47375,1 C16.108125,1.81875 17.48875,3.070625 18.465,4.619375 C19.469375,6.2125 20,8.05375 20,9.945625 C20,12.616875 18.96,15.128125 17.07125,17.016875 C15.1825,18.905625 12.67125,19.945625 10,19.945625 Z"/>
                </svg>
            </span>
            <span v-if="message" class="message">{{message}}</span>
        </div>
    </transition>

</template>

<script lang="ts">
    import Vue from "vue";
    import { SpinnerColor } from "@components/SpinnerTypes";

    export default Vue.extend({
        props: {
            message: String,
            color: { type: String as () => SpinnerColor, default: "dark" },
            delay: {
                type: Number,
                default: 0,
            }
        },
        created() {
            if (this.delay > 0) {
                this.delayTimeout = setTimeout(() => {
                    this.visible = true;
                }, this.delay)
            } else {
                this.visible = true;
            }
        },
        destroyed() {
            if (this.delayTimeout) {
                clearTimeout(this.delayTimeout);
            }
        },
        data(): {
            visible: boolean,
            delayTimeout: any | undefined
        } {
            return {
                visible: false,
                delayTimeout: undefined,
            }
        }


    })
</script>

<style scoped lang="scss">
    @import "common";
    @import "mixins";
    @import "transitions";

    .spinner-container {
        align-items: center;
        display: flex;
        flex-direction: row;
        justify-content: center;

        .spinner {
            animation: rotate 1s linear infinite;
            /*background: url(/assets/images/loading.svg) no-repeat;*/
            background-size: 2rem;
            content: '';
            /*display: inline-block;*/
            height: 2rem;
            transform-origin: center;
            width: 2rem;
            z-index: 1;
            display: flex;

            &.light {
                svg path {
                    fill: $white;
                }
            }

            &.dark {
                svg path {
                    fill: #444;
                }
            }


            /*margin-right: 1rem;*/
        }

        .message {
            margin-left: 1rem;
        }
    }


</style>
