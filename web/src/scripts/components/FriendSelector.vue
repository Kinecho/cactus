<template>
    <div>
      <div v-for="connection of connections">
        <SocialFriend :member="member" :connection="connection" />
        <input @click="toggleFriend(connection.friendMemberId, $event)" type="checkbox">
      </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import CactusMember from "@shared/models/CactusMember";
    import SocialConnection from "@shared/models/SocialConnection";
    import SocialFriend from '@components/SocialFriend.vue'
    import {getIntegerFromStringBetween} from '@shared/util/StringUtil';
    import SocialConnectionService from '@web/services/SocialConnectionService'
    import Logger from "@shared/Logger";

    const logger = new Logger("PromptContentCardReciprocalSharing.vue");

    export default Vue.extend({
        components: {
          SocialFriend
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
          toggleFriend(id: string, e: MouseEvent) {
            if (e.target) {
              const checkbox = e.target as HTMLInputElement;
              if (checkbox?.checked) {
                this.selectFriend(id);
              } else {
                this.deselectFriend(id);
              }
              logger.log(this.selectedFriends);
            }
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

</style>
