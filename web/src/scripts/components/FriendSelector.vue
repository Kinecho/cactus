<template>
    <ul class="friendSelector">
        <li class="listItem" v-for="connection of connections">
            <label :for="connection.friendMemberId">
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
                logger.log(this.selectedFriends);
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
        display: flex;
        justify-content: space-between;
        list-style: none;
        margin: 0;
        padding: 0;
        position: relative;
        text-align: left;
    }

    label {
        cursor: pointer;
        padding: 0 1.6rem;
        transition: background-color ease-in .3s;
        width: 100%;

        @include r(600) {
            &:hover {
                background-color: darken($beige, 3%);
                border-radius: 1.2rem;
            }
        }

        &:before {
            background-color: $white;
            border-radius: .4rem;
            bottom: 0;
            content: '';
            height: 2.4rem;
            margin: auto 0;
            position: absolute;
            right: 1.6rem;
            top: 0;
            width: 2.4rem;
        }
    }

    .itemCheckbox {
        opacity: 0;
        position: absolute;

        //checkmark
        &:checked + label:after {
            background-color: $white;
            bottom: 0;
            box-shadow:
              2px 0 0 $white,
              6px 0 0 $white,
              6px -2px 0 $white,
              6px -4px 0 $white,
              6px -6px 0 $white,
              6px -8px 0 $white;
            content: '';
            height: 4px;
            margin: auto 0;
            position: absolute;
            right: 3.2rem;
            top: 0;
            transform: rotate(45deg);
            width: 4px;
        }

        //label background when checked
        &:checked + label {
            background-color: darken($beige, 8%);
            border-radius: 1.2rem;
        }

        //box when checked
        &:checked + label:before {
            background-color: $magenta;
        }
    }

</style>
