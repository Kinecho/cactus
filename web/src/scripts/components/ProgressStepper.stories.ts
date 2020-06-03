import Vue from "vue";
import ProgressStepper from "@components/ProgressStepper.vue"
import { number } from "@storybook/addon-knobs";

export default {
    title: "Progress Stepper"
}

export const Default = () => Vue.extend({
    template: `
        <div :style="wrapperStyles">
            <progress-stepper :total="total" :current="current"/>
        </div>`,
    components: {
        ProgressStepper,
    },
    props: {
        total: {
            default: number("Total Steps", 6)
        },
        current: {
            default: number("Current Step", 3)
        }
    },
    computed: {
        wrapperStyles() {
            return {
                backgroundColor: 'white',
                padding: '5rem',
            }
        }
    }
})


export const Dots = () => Vue.extend({
    template: `
        <div :style="wrapperStyles">
            <progress-stepper :total="total" :current="current" type="dots"/>
        </div>`,
    components: {
        ProgressStepper,
    },
    props: {
        total: {
            default: number("Total Steps", 6)
        },
        current: {
            default: number("Current Step", 3)
        }
    },
    computed: {
        wrapperStyles() {
            return {
                backgroundColor: 'white',
                padding: '5rem',
                display: 'flex',
                justifyContent: 'center',
            }
        }
    }
})