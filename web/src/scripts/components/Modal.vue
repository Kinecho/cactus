<template>
    <transition name="modal" v-if="show">
        <div :class="['modal-mask', {show}]">
            <div class="modal-wrapper">
                <div class="modal-container">

                    <div class="modal-header">
                        <slot name="header">
                            <button @click="close" title="Close" class="modal-close tertiary"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                                <path fill="#33CCAB" d="M13.8513053,12 L21.6125213,19.7612161 C22.1291596,20.2778543 22.1291596,21.0958831 21.6125213,21.6125213 C21.3643894,21.8606532 21.0334408,22 20.6868687,22 C20.3402966,22 20.009348,21.8606532 19.7612161,21.6125213 L12,13.8513053 L4.23878394,21.6125213 C3.99065203,21.8606532 3.65970345,22 3.31313131,22 C2.96655918,22 2.63561059,21.8606532 2.38747868,21.6125213 C1.87084044,21.0958831 1.87084044,20.2778543 2.38747868,19.7612161 L10.1486947,12 L2.38747868,4.23878394 C1.87084044,3.7221457 1.87084044,2.90411693 2.38747868,2.38747868 C2.90411693,1.87084044 3.7221457,1.87084044 4.23878394,2.38747868 L12,10.1486947 L19.7612161,2.38747868 C20.2778543,1.87084044 21.0958831,1.87084044 21.6125213,2.38747868 C22.1291596,2.90411693 22.1291596,3.7221457 21.6125213,4.23878394 L13.8513053,12 Z"/>
                            </svg>
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
        background-color: rgba(255, 255, 255, .8);
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