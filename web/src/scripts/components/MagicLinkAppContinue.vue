<template>
    <div>
        <h1>Click below to login</h1>
        <a :href="deepLink">Log in on App</a>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {Config} from '@web/config'
    import {getAllQueryParams} from '@web/util'
    import {appendQueryParams} from '@shared/util/StringUtil'

    export default Vue.extend({
        created() {
            console.log("magic link app continue");
        },
        props: {
            link: {type: String, required: true}
        },
        data(): {} {
            return {}
        },
        computed: {
            deepLink(): string {
                const base = `${Config.appCustomScheme}://auth-actions`;
                let params = getAllQueryParams(self.link);
                return appendQueryParams(base, params);
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

</style>
