<template>
    <transition name="bounce-in" appear>
        <div class="celebrate-container">
            <h1>Whoop, whoop!<br/>You did it!</h1>
            <img src="/assets/images/celebrate.svg" class="illustration" alt="Celebrate!"/>
            <div class="stats-container">
                <section class="metric">
                    <span class="label">{{reflectionCount}}<spinner v-if="loading"/></span>

                    <h4>
                        Reflections
                    </h4>
                </section>
                <section class="metric">
                    <span class="label">{{totalMinutes}}<spinner v-if="loading"/></span>
                    <h4>
                        Minutes
                    </h4>
                </section>
                <section class="metric">
                    <span class="label">{{streakDays}}<spinner v-if="loading"/></span>
                    <h4>
                        Streak
                    </h4>
                </section>
            </div>
        </div>
    </transition>

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
                this.reflectionCount = Math.floor( Math.random() * 100);
                this.totalMinutes = Math.floor( Math.random() * 100);
                this.streakDays= Math.floor( Math.random() * 30);
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
        }
    })
</script>

<style lang="scss">
    @import "common";
    @import "mixins";
    @import "variables";

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

        .stats-container {
            display: flex;
            justify-content: space-around;
            padding: 2rem;

            .metric {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;

                .label {
                    font-size: 6rem;
                    display: block;
                    text-align: center;
                }
            }

        }
    }


</style>
