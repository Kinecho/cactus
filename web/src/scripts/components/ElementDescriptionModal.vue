<template>
    <modal :show="showContent"
            v-on:close="showContent = false"
            :showCloseButton="true"
    >
        <div class="modalContainer" slot="body">
            <!-- intro card -->
            <p class="description">Your happiest life depends on a balance of five elements.</p>
            <!-- end intro card -->

            <!-- element cards -->
            <div>
                <h3>{{cactusElement}}</h3>
                <p class="description">{{elementCopy[cactusElement.toUpperCase() + '_DESCRIPTION']}}</p>
            </div>
            <!-- end element cards -->

            <div class="btnContainer">
                <button class="tertiary icon left">
                    <svg class="arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18">
                        <path fill="#29A389" d="M12.586 7L7.293 1.707A1 1 0 0 1 8.707.293l7 7a1 1 0 0 1 0 1.414l-7 7a1 1 0 1 1-1.414-1.414L12.586 9H1a1 1 0 1 1 0-2h11.586z"/>
                    </svg>
                </button>
                <button class="tertiary icon right">
                    <svg class="arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18">
                        <path fill="#29A389" d="M12.586 7L7.293 1.707A1 1 0 0 1 8.707.293l7 7a1 1 0 0 1 0 1.414l-7 7a1 1 0 1 1-1.414-1.414L12.586 9H1a1 1 0 1 1 0-2h11.586z"/>
                    </svg>
                </button>
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

    export default Vue.extend({
        components: {
            Modal,
        },
        props: {
            cactusElement: String,
            autoLoad: {type: Boolean, default: true}
        },
        data(): {
            showContent: boolean,
            elementCopy: ElementCopy,
        } {
            return {
                showContent: false,
                elementCopy: copy.elements,
            }
        },
        // methods: {
        //     back() {
        //         this.$emit("back");
        //     },
        //     close() {
        //         this.$emit("close");
        //     },
        // },
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .modalContainer {
        background-color: $darkestGreen;
        border-radius: 1.2rem;
        color: $lightGreen;
        display: flex;
        flex-direction: column;
        min-height: 34rem;
        padding: 2.4rem;
        width: 30rem;

        .description {
            align-items: center;
            display: flex;
            flex-grow: 1;
            padding: 3.2rem 0;
        }

        .btnContainer {
            align-items: center;
            display: flex;
            justify-content: center;
        }

        .left {
            margin: -2px 1.6rem 0 0;
            transform: scale(-1);
        }

        .arrow {
            height: 1.8rem;
            width: 1.8rem;
        }
    }
</style>
