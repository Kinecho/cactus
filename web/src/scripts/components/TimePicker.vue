<template>
    <div class="time-picker-container">
        <multiselect
                :value="inputHour"
                :options="hourOptions"
                :placeholder="copy.common.HOUR"
                :showLabels="false"
                :hideSelected="false"
                @input="handleHourChange">
        </multiselect>
        <multiselect
                :custom-label="minuteDisplayLabel"
                :value="minute"
                :options="minuteOptions"
                :placeholder="copy.common.MINUTE"
                :showLabels="false"
                :hideSelected="false"
                @input="handleMinuteChange">
        </multiselect>
        <multiselect
                :options="amPmOptions"
                placeholder=""
                :showLabels="false"
                :hideSelected="false"
                :value="amPmValue"
                @input="setAmPm"
        >
        </multiselect>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Multiselect from "vue-multiselect"
    import 'vue-multiselect/dist/vue-multiselect.min.css'
    import CopyService from '@shared/copy/CopyService'
    import {LocalizedCopy} from '@shared/copy/CopyTypes'
    import Logger from "@shared/Logger";

    const logger = new Logger("TimePicker.vue");
    const copy = CopyService.getSharedInstance().copy;
    
    export default Vue.extend({
        components: {
            Multiselect,
        },
        props: {
            hour: Number,
            minute: Number
        },
        data(): { hourOptions: number[], minuteOptions: number[], amPmOptions: ["AM", "PM"], amPm: "AM" | "PM", copy: LocalizedCopy } {
            return {
                hourOptions: [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
                minuteOptions: [0, 15, 30, 45],
                amPmOptions: ["AM", "PM"],
                amPm: this.hour >= 12 ? "PM" : "AM",
                copy: copy,
            }
        },
        computed: {
            inputHour(): number {
                let h = this.hour;
                if (this.amPm === "PM" && h > 12) {
                    h = h - 12;
                } else if (this.amPm === "AM" && h === 0) {
                    h = 12
                }
                return h
            },
            amPmValue(): "AM" | "PM" {
                return this.hour >= 12 ? "PM" : "AM"
            }
        },
        methods: {
            hourDisplayLabel(hour: number) {
                let h = hour;
                if (this.amPm === "PM" && hour > 12) {
                    h = h - 12;
                } else if (this.amPm === "AM" && hour === 0) {
                    h = 12
                }
                return `${h}`
            },
            minuteDisplayLabel(minute: number) {
                if (minute < 10) {
                    return `0${minute}`
                }
                return `${minute}`
            },
            handleHourChange(newValue: number | undefined) {
                logger.log("hour changed changed", newValue);
                // const newValue = "";

                let h = newValue || 0;
                if (this.amPm === "PM" && h < 12) {
                    h = h + 12
                } else if (this.amPm === "AM" && h >= 12) {
                    h = h - 12
                }
                this.$emit('change', {hour: h, minute: this.minute});
                this.$forceUpdate();
            },
            handleMinuteChange(newValue: number | undefined) {
                logger.log("minuteChanged", newValue);
                this.$emit('change', {hour: this.hour, minute: newValue});
                this.$forceUpdate()
            },
            setAmPm(newValue: "AM" | "PM") {
                this.amPm = newValue;
            }
        },
        watch: {
            hour(newValue:number){
                this.amPm = newValue >= 12 ? "PM" : "AM"
            },
            amPm(newValue: "AM" | "PM") {
                if (newValue === "AM" && this.hour > 12) {
                    this.handleHourChange(this.hour - 12);
                } else if (newValue === "PM" && this.hour < 12) {
                    this.handleHourChange(this.hour + 12);
                }
            },
        }
    })
</script>


<style lang="scss" scoped>
    /*@import "~vue-multiselect";*/

    .time-picker-container {
        display: flex;
        flex-direction: row;
    }

    .multiselect {
        margin: .4rem 1.6rem 0 0;
        width: auto;
    }
</style>
