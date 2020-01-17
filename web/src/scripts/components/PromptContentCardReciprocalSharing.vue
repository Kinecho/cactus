<template>
    <div>
        <shared-reflection-card :response="response"/>
        <h2>Share your reflection with friends</h2>
        <p>Build stronger connections with friends through sharing. After you've both reflected, your notes will be shared with each other.</p>
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
</style>