<template>
    <div class="journalEntry skeleton">
        <p class="date" v-if="promptDate">{{promptDate}}</p>
        <div class="menuParent"></div>

        <div class="textContainer">
            <h3 class="topic">
                <skeleton-bar :lines="1" size="large"/>
            </h3>
            <p class="subtext">
                <skeleton-bar :lines="2" size="small"/>
            </p>
        </div>

        <div class="entry">
            <skeleton-bar :lines="2" size="small"/>
        </div>

        <div class="skeleton-image">
            <div class="image-wrapper">
                <skeleton-bar :lines="1" size="block"/>
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
        created() {

        },
        props: {
            sentPrompt: Object as () => SentPrompt
        },
        data(): {} {
            return {}
        },
        computed: {
            promptDate(): string | undefined {
                return this.sentPrompt ? formatDate(this.sentPrompt.firstSentAt, "LLLL d, yyyy") : undefined;
            },
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";
    @import "journal";

    .skeleton-image {
        height: 100%;
        position: absolute;
        right: 2.6rem;
        bottom: 0;
        width: 25%;
        display: flex;
        justify-content: center;
        align-items: center;
        .image-wrapper{
            height: 50%;
            width: 100%;
        }

        @include maxW(600){
            display: none;
        }
    }

</style>
