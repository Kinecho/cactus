<template>
    <div>
      <div v-for="connection of connections">
        <SocialFriend :member="member" :connection="connection" />
        <CheckBox />
      </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import CactusMember from "@shared/models/CactusMember";
    import SocialConnection from "@shared/models/SocialConnection";
    import SocialFriend from '@components/SocialFriend.vue'
    import {getIntegerFromStringBetween} from '@shared/util/StringUtil';
    import CheckBox from "@components/CheckBox.vue";
    import SocialConnectionService from '@web/services/SocialConnectionService'

    export default Vue.extend({
        components: {
          CheckBox,
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
            connections: SocialConnection[],
            selectedConnections: string[]
        } {
            return {
              connections: [],
              selectedConnections: []
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

</style>
