<template>
    <ul class="friendSelector">
        <li class="listItem" v-for="connection of connections">
            <label class="itemLabel" :for="connection.friendMemberId">
                <SocialFriend :member="member" :connection="connection" />
            </label>
            <CheckBox :inputId="connection.friendMemberId" v-on:change="function(emittedValue) { toggleFriend(connection.friendMemberId, emittedValue) }" />
        </li>
    </ul>
</template>

<script lang="ts">
    import Vue from "vue";
    import CheckBox from "@components/CheckBox.vue";
    import CactusMember from "@shared/models/CactusMember";
    import SocialConnection from "@shared/models/SocialConnection";
    import SocialFriend from '@components/SocialFriend.vue'
    import {getIntegerFromStringBetween} from '@shared/util/StringUtil';
    import SocialConnectionService from '@web/services/SocialConnectionService'
    import Logger from "@shared/Logger";

    const logger = new Logger("PromptContentCardReciprocalSharing.vue");

    export default Vue.extend({
        components: {
          SocialFriend,
          CheckBox
        },
        props: {
            member: {type: Object as () => CactusMember}
        },
        async beforeMount() {
          if (this.member?.id) {
            this.connections = await SocialConnectionService.sharedInstance.getByMemberId(this.member.id)
          }
        },
        data(): {
            connections: SocialConnection[] | undefined,
            selectedFriends: string[]
        } {
            return {
              connections: undefined,
              selectedFriends: []
            }
        },
        methods: {
            toggleFriend(id: string, isTrue: boolean) {
                if (isTrue) {
                    this.selectFriend(id);
                } else {
                    this.deselectFriend(id);
                }
                this.$emit('change', this.selectedFriends);
              },
            selectFriend(id: string) {
                this.selectedFriends.push(id);
            },
            deselectFriend(id: string) {
                this.selectedFriends = this.selectedFriends.filter(
                    function(selectedFriendId: string){
                        return selectedFriendId != id;
                    }
                );
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .friendSelector {
        list-style: none;
        margin: 0;
        padding: 0;
    }

    .listItem {
        align-items: center;
        border-radius: 1.2rem;
        display: flex;
        justify-content: space-between;
        list-style: none;
        margin: 0;
        padding: 0 .8rem;
        position: relative;
        text-align: left;
        transition: background-color ease-in .3s;
        user-select: none;

        &:active,
        &:hover {
            background-color: darken($beige, 3%);
        }

        @include r(600) {
            padding: 0 .8rem 0 1.6rem;
        }
    }

    .listItem,
    .itemLabel {
        cursor: pointer;
    }

    .itemLabel {
        flex-grow: 1;
        max-width: 88%;
    }
</style>
