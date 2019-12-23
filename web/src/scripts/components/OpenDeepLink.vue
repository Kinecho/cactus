<template>
    <a v-if="showLink" :href="appUrl">
        {{text}}
    </a>
</template>

<script lang="ts">
    import Vue from "vue";
    import {DeviceType, getDeviceType, isIOSDevice} from "@web/DeviceUtil";
    import {Config} from "@web/config";
    import {appendQueryParams} from "@shared/util/StringUtil";
    import {QueryParam} from "@shared/util/queryParams";
    import CopyService from "@shared/copy/CopyService";
    import {getQueryParam} from "@web/util";

    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
        created() {

        },
        props: {
            //Will use current href by default
            link: {type: String, required: false},
            text: {type: String, required: false, default: copy.navigation.OPEN_IN_APP}
        },
        data(): {} {
            return {}
        },
        computed: {
            showLink(): boolean {
                return isIOSDevice() || !!getQueryParam(QueryParam.SHOW_DEEP_LINK);
            },
            appUrl(): string {
                let appUrl = this.link || window.location.href;

                switch (getDeviceType()) {
                    case DeviceType.ANDROID:
                        // link = "";
                        break;
                    case DeviceType.IOS:
                        const hostPath = window.location.href.split("//")[1];
                        const withParams = appendQueryParams(hostPath, {[QueryParam.SHOW_DEEP_LINK]: true});
                        appUrl = `${Config.appCustomScheme}://${withParams}`;
                        break;
                    case DeviceType.DESKTOP:
                    default:
                        break;
                }
                return appUrl;
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

</style>
