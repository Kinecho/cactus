<template>
    <multiselect
            :value="zoneValue"
            :options="zones"
            :custom-label="displayLabel"
            placeholder="Select one"
            label="name"
            track-by="zoneName"
            @input="handleChange">
    </multiselect>
</template>

<script lang="ts">
    import Vue from "vue";
    import Multiselect from "vue-multiselect"
    import {findByZoneName, timezoneInfoList, ZoneInfo, zonesByName} from '@web/timezones'
    import 'vue-multiselect/dist/vue-multiselect.min.css'
    export default Vue.extend({
        components: {
          Multiselect,
        },
        props: {
            value: String,
        },
        data() {
            return {
                zones: timezoneInfoList
            }
        },
        methods: {
            displayLabel(zone:ZoneInfo) {
                return `(${zone.offsetDisplay}) ${zone.displayName}`
            },
            handleChange(newValue:ZoneInfo|undefined){
                console.log("multiselect changed", newValue);
                // const newValue = "";
                this.$emit('change', newValue)
            }
        },
        computed: {
            zoneValue():ZoneInfo|undefined{
                return findByZoneName(this.value)
            }
        }
    })
</script>


<style lang="scss" scoped>
    /*@import "~vue-multiselect";*/
</style>