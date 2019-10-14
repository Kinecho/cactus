<template>
    <div class="elements-container">
        <div class="element-icon" v-for="element in elements">
            <img :src="'/assets/images/cacti/'+ element + '-3.svg'"/>
            <h4 class="maroon label">#{{element}}</h4>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {
        CactusElement
    } from "@shared/models/PromptContent"
    import {formatDate} from '@shared/util/DateUtil'
    import CopyService from "@shared/copy/CopyService"
    import {getDeviceDimensions, MOBILE_BREAKPOINT_PX} from "@web/DeviceUtil"
    import {Image} from '@shared/models/PromptContent'

    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
        components: {
        },
        created() {

        },
        props: {

        },
        data(): {
            resizeListener: any | undefined,
            deviceWidth: number,
        } {
            return {
                resizeListener: undefined,
                deviceWidth: 0,
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
            &:nth-child(1) {
                align-self: end;
                grid-column: 1 / 3;
            }
            &:nth-child(2), &:nth-child(3) {
                margin: 2.4rem 0 3.2rem;
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
                $avatarSize: 6.4rem;
                height: $avatarSize;
                width: $avatarSize;
            }
        }
    }
</style>
