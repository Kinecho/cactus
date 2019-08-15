<template>
    <transition name="modal" v-if="show">
        <div :class="['modal-mask', {show}]">
            <div class="modal-wrapper">
                <div class="modal-container">

                    <div class="modal-header">
                        <slot name="header">
                            <button @click="close" title="Close" class="modal-close tertiary icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" width="18" height="18"><path fill="#33ccab" d="M8.414 7l5.293 5.293a1 1 0 0 1-1.414 1.414L7 8.414l-5.293 5.293a1 1 0 1 1-1.414-1.414L5.586 7 .293 1.707A1 1 0 1 1 1.707.293L7 5.586 12.293.293a1 1 0 0 1 1.414 1.414L8.414 7z"/></svg>
                            </button>
                        </slot>
                    </div>

                    <div class="modal-body">
                        <slot name="body">
                            default body
                        </slot>
                    </div>

                    <div class="modal-footer">
                        <slot name="footer"></slot>
                    </div>
                </div>
            </div>
        </div>
    </transition>

</template>

<script lang="ts">
    import Vue from "vue";
    export default Vue.extend({
        props: {
          show: Boolean,
        },
        methods: {
            close(){
                this.$emit("close");
            }
        },
        watch: {
            show(newValue) {
                if (newValue){

                    document.body.classList.add("no-scroll");
                } else {
                    document.body.classList.remove("no-scroll");
                }
            }
        }
    })
</script>

<style lang="scss">

    .modal-mask {
        position: fixed;
        z-index: 9998;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(255, 255, 255, .9);
        transition: opacity .3s ease;
        overflow-y: auto;
    }

    .modal-container {
        margin: 0 auto;
        border-radius: 2px;
        transition: all .3s ease;
    }

    .modal-header {
        .modal-close {
            z-index: 100;
        }
    }

    .modal-body {
        margin: 0 0;
    }

    .modal-default-button {
        float: right;
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
