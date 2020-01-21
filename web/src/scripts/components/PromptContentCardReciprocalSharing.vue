<template>
    <div class="shareReflection">
        <shared-reflection-card :response="response"/>
        <h2 class="header">Share your reflection with&nbsp;friends</h2>
        <p class="subtext">Build stronger connections with friends through sharing. After you've both reflected, your notes will be shared with each&nbsp;other.</p>
        <friend-selector :member="member" />
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import SharedReflectionCard from "@components/SharedReflectionCard.vue";
    import Logger from "@shared/Logger";
    import SharingService from '@web/services/SharingService';
    import ReflectionResponse from '@shared/models/ReflectionResponse';
    import FriendSelector from "@components/FriendSelector.vue";
    import CactusMember from '@shared/models/CactusMember'

    const logger = new Logger("PromptContentCardReciprocalSharing.vue");

    export default Vue.extend({
        components: {
            SharedReflectionCard,
            FriendSelector
        },
        props: {
            member: Object as () => CactusMember,
            response: Object as () => ReflectionResponse
        },
        data(): {
            nativeShareEnabled: boolean,
        } {
            return {
                nativeShareEnabled: SharingService.canShareNatively()
            }
        },
    });
</script>

<style lang="scss" scoped>
    @import "variables";
    @import "mixins";
    @import "forms";
    @import "common";
    @import "transitions";

    .shareReflection {
        background-color: $beige; //this is likely temporary until the card is moved.
        padding: 2.4rem;

        @include r(600) {
            max-height: 60rem;
            overflow: auto;
        }
    }

    .header {
        font-size: 3.2rem;
        line-height: 1.2;
        margin-bottom: .8rem;
        padding-top: 1.6rem;

        @include r(600) {
            padding-top: 0;
        }
    }

    .subtext {
        margin-bottom: 1.6rem;
        opacity: .8;
    }

</style>
