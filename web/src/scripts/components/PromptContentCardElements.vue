<template>
    <div class="elements-container">
        <a href="#" class="element-icon" v-for="element in elements" @click="showCactusModal(element)">
            <img :src="'/assets/images/cacti/'+ element + '-3.svg'"/>
            <h4 class="maroon label">{{element}}</h4>
        </a>
        <element-description-modal
            :cactusElement = "cactusModalElement"
            :showModal="cactusModalVisible"
            @close="cactusModalVisible = false" />
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {CactusElement} from "@shared/models/CactusElement"
    import {formatDate} from '@shared/util/DateUtil'
    import CopyService from "@shared/copy/CopyService"
    import {getDeviceDimensions, MOBILE_BREAKPOINT_PX} from "@web/DeviceUtil"
    import {Image} from '@shared/models/PromptContent'
    import ElementDescriptionModal from "@components/ElementDescriptionModal.vue"

    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
        components: {
            ElementDescriptionModal,
        },
        created() {

        },
        props: {

        },
        data(): {
            resizeListener: any | undefined,
            deviceWidth: number,
            cactusModalVisible: boolean,
            cactusModalElement: string | undefined,
            cactusElement: CactusElement | undefined
        } {
            return {
                resizeListener: undefined,
                deviceWidth: 0,
                cactusModalVisible: false,
                cactusModalElement: undefined,
                cactusElement: undefined
            }
        },
        destroyed() {
            if (this.resizeListener) {
                window.removeEventListener("resize", this.resizeListener);
            }
        },
        mounted() {
            this.deviceWidth = getDeviceDimensions().width;
            this.resizeListener = window.addEventListener("resize", () => {
                this.deviceWidth = getDeviceDimensions().width;
            })
        },
        computed: {
            elements(): Array<string> {
                return Object.values(CactusElement);
            }
        },
        methods: {
            showCactusModal(element: keyof typeof CactusElement) {
                this.cactusModalElement = CactusElement[element];
                this.cactusModalVisible = true;
            },
            hideCactusModal() {
                this.cactusModalVisible = false;
            }
        }
    })
</script>


<style lang="scss" scoped>
    @import "variables";
    @import "mixins";
    @import "forms";
    @import "common";
    @import "transitions";

    .elements-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr 1fr 1fr;

        .element-icon {
            text-decoration: none;

            &:nth-child(1) {
                align-self: end;
                grid-column: 1 / 3;
            }
            &:nth-child(2), &:nth-child(3) {
                margin-bottom: 3.2rem;
            }
            &:nth-child(4) {
                justify-self: end;
                margin-right: 1.6rem;
            }
            &:nth-child(5) {
                justify-self: start;
                margin-left: 1.6rem;
            }

            img {
                $avatarSize: 9.6rem;
                height: $avatarSize;
                width: $avatarSize;
            }
        }
    }
</style>
