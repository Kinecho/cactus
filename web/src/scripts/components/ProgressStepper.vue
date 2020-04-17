<template>
    <div class="progress">
        <span v-for="(step, i) in steps" :key="`step_${i}`" class="step" :class="{completed: step.completed, current: step.current}"></span>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";

    interface Step {
        completed: boolean,
        current: boolean
    }

    export default Vue.extend({
        name: "ProgressStepper",
        props: {
            total: Number,
            current: { type: Number, default: 0 },
        },
        computed: {
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
        flex-direction: row;
        background: $darkestGreen;

        height: .5rem;

        .step {
            flex: 1;

            &.completed {
                background: $green;
            }

            &.current {
                background: $yellow;
            }
        }

    }
</style>