<template>
    <div class="skeleton-bar" :class="{'animating': animating}">
        <div v-for="n in lines" class="line" :class="[size]"></div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";

    export default Vue.extend({
        created() {

        },
        props: {
            animating: {type: Boolean, default: true},
            lines: {type: Number, default: 1},
            size: {
                validator: (value: string) => ['small', 'medium', 'large', 'xl', 'block'].includes(value),
                default: "medium"
            }

        },
        data(): {} {
            return {}
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";


    .skeleton-bar {
        height: 100%;
        width: 100%;

        &.animating .line:after {
            display: block;
            content: '';
            position: absolute;
            width: 100%;
            height: 100%;
            transform: translateX(-100%);
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .2), transparent);
            animation: loading 1.5s infinite;
        }
 
        .line {
            color: $lightGray;
            background-color: $lightGray;
            border-radius: .4rem;
            height: 2rem;
            position: relative;
            overflow: hidden;
            width: 100%;
            margin-bottom: 1.6rem;

            &.small {
                height: 1.2rem;
                margin-bottom: 0.5rem;
            }

            &.medium {
                height: 2.5rem;
                margin-bottom: 1rem;
            }

            &.large {
                height: 3.5rem;
                margin-bottom: 1.5rem;
            }

            &.xl {
                height: 4em;
                margin-bottom: 2rem;
            }

            &.block {
                height: 100%;
                margin-bottom: 3rem;
            }
        }
    }


    @keyframes loading {
        100% {
            transform: translateX(100%);
        }
    }

    @keyframes shine {
        10% {
            opacity: 1;
            top: -30%;
            left: -30%;
            transition-property: left, top, opacity;
            transition-duration: 0.7s, 0.7s, 0.15s;
            transition-timing-function: ease;
        }
        100% {
            opacity: 0;
            top: -30%;
            left: -30%;
            transition-property: left, top, opacity;
        }
    }

</style>
