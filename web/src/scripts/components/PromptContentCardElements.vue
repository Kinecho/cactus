<template>
    <div class="elements-container">
        <div class="element-icon" v-for="element in elements">
            <img src="/assets/images/grow5.svg"/>
            <h4 class="label">#{{element}}</h4>
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
        display: flex;
        flex-direction: column;

        .element-icon {
            margin-bottom: 2.4rem;

            img {
                $avatarSize: 5.6rem;
                height: $avatarSize;
                width: $avatarSize;
            }
        }
    }
</style>
