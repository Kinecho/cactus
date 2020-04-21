<template>

</template>

<script lang="ts">
    import Vue from "vue";

    const confetti = require('canvas-confetti');
    const count = 200;
    const defaults = {
        origin: { y: 0.7 }
    };
    const colors = ['#0DADB1', '#6590ED', '#9C1AA3', '#294FA3', '#47445E'];

    export default Vue.extend({
        name: "CactusConfetti",
        props: {
            running: { type: Boolean, default: false },
        },
        watch: {
            running(run, previous) {
                if (run && !previous) {
                    this.run();
                } else {
                    confetti.reset();
                }
            }
        },
        methods: {
            run() {
                function fire(particleRatio: number, opts: any) {
                    confetti.default(Object.assign({}, defaults, opts, {
                        particleCount: Math.floor(count * particleRatio),
                        colors: colors
                    }));
                }

                fire(0.25, {
                    spread: 26,
                    startVelocity: 55,
                });
                fire(0.2, {
                    spread: 60,
                });
                fire(0.35, {
                    spread: 100,
                    decay: 0.91,
                });
                fire(0.1, {
                    spread: 120,
                    startVelocity: 25,
                    decay: 0.92,
                });
                fire(0.1, {
                    spread: 120,
                    startVelocity: 45,
                });
            },

        }

    })
</script>

<style scoped lang="scss">

</style>