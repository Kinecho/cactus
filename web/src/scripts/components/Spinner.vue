<template>
    <transition name="fade-in" appear v-if="visible">
        <div class="spinner-container">
            <img src="/assets/images/loading.svg" alt="Loading" class="spinner"/>
            <span v-if="message" class="message">{{message}}</span>
        </div>
    </transition>

</template>

<script lang="ts">
    import Vue from "vue";

    export default Vue.extend({
        props: {
            message: String,
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

    .spinner-container {
        align-items: center;
        display: flex;
        flex-direction: row;
        justify-content: center;

        .spinner {
            animation: rotate 1s linear infinite;
            background: url(/assets/images/loading.svg) no-repeat;
            background-size: 2rem;
            content: '';
            display: inline-block;
            height: 2rem;
            transform-origin: center;
            width: 2rem;
            z-index: 1;
            /*margin-right: 1rem;*/
        }

        .message {
            margin-left: 1rem;
        }
    }


</style>
