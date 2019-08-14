<template>
    <div class="celebrate-container">
        <h1>Whoop, whoop!<br/>You did it!</h1>
        <img src="/assets/images/celebrate.svg" class="illustration" alt="Celebrate!"/>
        <div class="stats-container">
            <section class="metric">
                <div class="label">
                    <transition mode="out-in">
                        <span v-if="reflectionCount !== undefined">{{reflectionCount}}</span>
                        <spinner v-if="!reflectionCount"/>
                    </transition>
                </div>

                <h4>
                    Reflections
                </h4>
            </section>
            <section class="metric">
                <div class="label">
                    <transition mode="out-in">
                        <span v-if="totalMinutes !== undefined">{{totalMinutes}}</span>
                        <spinner v-if="!totalMinutes"/>
                    </transition>
                </div>
                <h4>
                    Minutes
                </h4>
            </section>
            <section class="metric">
                <div class="label">
                    <transition mode="out-in">
                        <span v-if="streakDays !== undefined">{{streakDays}}</span>
                        <spinner v-if="!streakDays"/>
                    </transition>
                </div>
                <h4>
                    Streak
                </h4>
            </section>
        </div>
        <div class="actions">
            <button class="button secondary" @click="back">Back</button>
            <button class="button secondary" @click="restart">Restart</button>
            <button class="button secondary" @click="close">Close</button>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Spinner from "@components/Spinner.vue";

    export default Vue.extend({
        components: {
            Spinner,
        },
        created() {


            setTimeout(() => {
                this.reflectionCount = Math.floor(Math.random() * 100);
                this.totalMinutes = Math.floor(Math.random() * 100);
                this.streakDays = Math.floor(Math.random() * 30);
                this.loading = false;

            }, 1000);
        },
        props: {},
        data(): {
            reflectionCount: number | undefined,
            totalMinutes: number | undefined,
            streakDays: number | undefined,
            loading: boolean,
        } {
            return {
                reflectionCount: undefined,
                totalMinutes: undefined,
                streakDays: undefined,
                loading: true,
            }
        },
        methods: {
            back() {
                this.$emit("back");
            },
            close() {
                this.$emit("close");
            },
            restart() {
                this.$emit("restart");
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";
    @import "transitions";

    .celebrate-container {
        width: 100%;
        display: flex;
        flex-direction: column;

        @include r(600) {
            border-radius: 12px;
            box-shadow: rgba(7, 69, 76, 0.18) 0 11px 28px -8px;
            max-height: 66rem;
            max-width: 48rem;
            position: relative;
            overflow: hidden;
        }

        .illustration {
            width: 100%;
            padding: 1rem;
        }

        .actions {
            display: flex;
            justify-content: space-between;
        }

        .stats-container {
            display: flex;
            justify-content: space-around;
            padding: 2rem;

            .metric {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                flex-grow: 0;

                .label {
                    font-size: 6rem;
                    display: block;

                    text-align: center;
                    min-height: 7rem;
                }
            }

        }
    }


</style>
