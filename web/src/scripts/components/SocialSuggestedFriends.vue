<template>
    <div class="socialSuggestedFriends">
        <div v-if="suggestedFriends.length > 0">
            <h2>Suggested Friends</h2>
            <friend 
                v-for="(friend, index) in suggestedFriends"
                v-bind:member="member"
                v-bind:friend="friend"
                v-bind:key="friend.memberId" 
            />
        </div> 
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import CopyService from '@shared/copy/CopyService';
    import {ElementCopy} from '@shared/copy/CopyTypes';
    import CactusMember from "@shared/models/CactusMember";
    import SocialFriend from "@components/SocialFriend.vue"

    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
        components: {
            friend: SocialFriend
        },
        props: {
            member: {type: Object as () => CactusMember},
        },
        beforeMount() {
            
        },
        data(): {
            suggestedFriends: Array<any>
        } {
            return {
                suggestedFriends: [
                    {memberId: 'asdsfsdfs1', name: 'Ryan Brown', status: undefined},
                    {memberId: 'sd23231rrs', name: 'Jane Fonda', status: 'Pending'},
                    {memberId: 'asda232321', name: 'Robert Redford', status: 'Connected'},
                ]
            }
        },
        computed: {
            
        },
        watch: {
            
        },
        methods: {
        
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .socialSuggestedFriends {
        width: 40rem;
    }

</style>
