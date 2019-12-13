<template>
    <div class="event skeleton">
        <div class="avatar skeleton">
            <skeleton-bar :lines="1" size="block"/>
        </div>
        <div class="main">
            <div class="date skeleton">
                <skeleton-bar :lines="1" size="small"/>
            </div>
            <div class="description skeleton">
                <skeleton-bar :lines="2" size="small"/>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import SentPrompt from '@shared/models/SentPrompt'
    import {formatDate} from "@shared/util/DateUtil"
    import SkeletonBar from "@components/SkeletonBar.vue"

    export default Vue.extend({
        components: {
            SkeletonBar,
        },
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .event.skeleton {
        border-bottom: 1px solid $lightestGreen;
        font-size: 1.6rem;
        margin: 0 -2.4rem;
        padding: 1.6rem;
        text-align: left;
        display: flex;

        @include r(374) {
            background-color: white;
            border: 0;
            border-radius: 12px;
            box-shadow: 0 5px 11px -3px rgba(0, 0, 0, 0.08);
            margin: 0 -1.6rem .4rem;
        }

        @include r(600) {
            font-size: 1.8rem;
            margin: 0 0 3.2rem;
            max-width: 64rem;
            padding: 2.4rem;

            &.demo {
                max-width: 48rem;
            }
        }
    }

    .main {
        width: 100%;
    }

    .date.skeleton {
        width: 12rem;
        margin-bottom: 1rem;
    }

    .description.skeleton {
        width: 100%;
        margin-bottom: 1.2rem;
    }

    .avatar.skeleton {
        width: 5.5rem;
        height: 5.5rem;
    }
</style>
