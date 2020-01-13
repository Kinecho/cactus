<template>
    <div class="invite-friends">
        <h2>Mindful Friends</h2>
        <p>Your mindfulness journey is more effective when you share it with others.</p>
        <button>Invite a friend</button>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {formatDate} from '@shared/util/DateUtil'
    import CopyService from "@shared/copy/CopyService"
    import {getDeviceDimensions, MOBILE_BREAKPOINT_PX} from "@web/DeviceUtil"
    import {Image} from '@shared/models/PromptContent'

    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
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
        }
    })
</script>


<style lang="scss" scoped>
    @import "variables";
    @import "mixins";
    @import "forms";
    @import "common";
    @import "transitions";


</style>
