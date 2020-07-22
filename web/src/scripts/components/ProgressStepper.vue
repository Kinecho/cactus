<template>
    <div class="progress" :class="[type]">
        <span v-if="type === 'rectangle'" class="step completed" :style="rectangleStyle"></span>
        <span v-else v-for="(step, i) in steps"
                :key="`step_${i}`"
                class="step"
                :class="{completed: step.completed, current: step.current}"></span>

    </div>
</template>

<script lang="ts">
    import Vue from "vue";

    interface Step {
        completed: boolean,
        current: boolean
    }

    export enum StepperStyle {
        dots = "dots",
        rectangle = "rectangle",
    }

    export default Vue.extend({
        name: "ProgressStepper",
        props: {
            total: Number,
            current: { type: Number, default: 0 },
            type: {
                type: String as () => StepperStyle,
                default: StepperStyle.rectangle,
                required: false,
                validator(value: string): boolean {
                    return Object.values(StepperStyle).includes(value);
                }
            },
        },
        computed: {
            rectangleStyle(): Record<string, any> {
                const widthPercent = ((this.current + 1) / this.total ?? 1) * 100;
                return {
                    width: `${ widthPercent }%`
                };
            },
            steps(): Step[] {
                const steps: Step[] = [];
                for (let i = 0; i < this.total; i++) {
                    const step: Step = { completed: false, current: false };
                    if (i < this.current) {
                        step.completed = true;
                    }
                    if (i === this.current) {
                        step.current = true;
                    }

                    steps.push(step);
                }

                return steps;
            }
        }
    })
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";

    .progress {
        display: flex;

        &.rectangle {
            background-color: $darkestGreen;

            .step {
                /*flex: 1;*/
                transition: width .2s;
                height: .4rem;
            }
        }

        &.dots {
            $diameter: 0.8rem;
            height: $diameter;
            justify-content: center;

            .step {
                border-radius: 50%;
                height: $diameter;
                margin: 0 .4rem;
                width: $diameter;
            }
        }
    }

    .step {
        background-color: $darkestGreen;

        &.completed,
        &.current {
            background-color: $green;
        }
    }

</style>
