<template>
    <div class="shareReflection">
        <shared-reflection-card :response="response"/>
        <h2 class="header">Share your reflection with&nbsp;friends</h2>
        <p class="subtext">Build stronger connections with friends through sharing. After you've both reflected, your notes will be shared with each&nbsp;other.</p>
        <friend-selector :member="member" @change="updateFriends" />
        <button v-if="hasFriendsSelected" class="shareBtn" :disabled="sharingNote || noteShared" @click="shareNote">
            <span v-if="readyToShare">Share</span>
            <span v-if="sharingNote">Sharing...</span>
            <span v-if="noteShared">Shared!</span>
        </button>
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
    import ReflectionResponseService from '@web/services/ReflectionResponseService'

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
            selectedFriends: string[],
            nativeShareEnabled: boolean,
            shareableLinkUrl: string | undefined,
            sharingNote: boolean,
            noteShared: boolean
        } {
            return {
                nativeShareEnabled: SharingService.canShareNatively(),
                shareableLinkUrl: undefined,
                sharingNote: false,
                noteShared: false,
                selectedFriends: []
            }
        },
        computed: {
            hasFriendsSelected(): boolean {
                return this.selectedFriends.length > 0;
            },
            readyToShare(): boolean {
                return (this.hasFriendsSelected && !this.sharingNote && !this.noteShared)
            }
        },
        methods: {
            async shareNote() {
                this.sharingNote = true;
                if(!this.response.shared) {
                    const reflectionResponse = await ReflectionResponseService.sharedInstance.shareResponse(this.response);
                    this.shareableLinkUrl = ReflectionResponseService.getShareableUrl(reflectionResponse);
                } else {
                    this.shareableLinkUrl = ReflectionResponseService.getShareableUrl(this.response);
                }

                if (this.shareableLinkUrl) {
                    this.sharingNote = false;
                    this.noteShared = true;
                }
            },
            updateFriends(friends: string[]) {
                this.selectedFriends = friends;
            }
        }
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

    .shareBtn {
        bottom: 0;
        margin-top: 2.4rem;
        position: sticky;
        width: 100%;

        @include r(600) {
            min-width: 60%;
            width: auto;
        }
    }

</style>
