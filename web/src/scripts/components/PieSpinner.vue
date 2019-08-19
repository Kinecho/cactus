<template>
    <div class="pie-wrapper">
        <div class="spinner pie" v-bind:style="rotationStyles"></div>
        <div class="filler pie" v-bind:style="fillStyles"></div>
        <div class="pie-mask" v-bind:style="maskStyles"></div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";

    export default Vue.extend({
        created() {

        },
        props: {
            percent: {type: Number, default: 0}
        },
        data(): {} {
            return {
            }
        },
        computed: {
            rotationStyles(): any {
                return {
                    transform: `rotate(${(this.percent || 0) * 360}deg)`
                }
            },
            maskStyles(): any {
                return {
                    // opacity: Math.max(1 - ((this.percent || 0) * 2), 0)
                    opacity: this.percent >= .5 ? 0 : 1,
                }
            },
            fillStyles(): any {
                return {
                    opacity: this.percent >= .5 ? 1 : 0,
                }
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    $pieDiameter: 100%;
    $pieBorderSize: 0px;

    .pie-wrapper {
        width: $pieDiameter;
        height: $pieDiameter;
        position: relative;
        background: white;

        .pie {
            width: 50%;
            height: 100%;
            transform-origin: 100% 50%;
            position: absolute;
            background: $lightGreen;
            border: $pieBorderSize solid rgba(0, 0, 0, 0.4);

            &.spinner {
                border-radius: 100% 0 0 100% / 50% 0 0 50%;
                z-index: 200;
                border-right: none;
            }

            &.filler {
                border-radius: 0 100% 100% 0 / 0 50% 50% 0;
                z-index: 100;
                border-left: none;
                left: 50%;
                opacity: 0;
            }
        }

        .pie-mask {
            width: 50%;
            height: 100%;
            position: absolute;
            z-index: 300;
            opacity: 1;
            background: inherit;
        }
    }

</style>
