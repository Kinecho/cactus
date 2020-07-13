<template>
    
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import CactusMember from "@shared/models/CactusMember";
    import { Prop } from "vue-property-decorator";
    import { PageRoute } from "@shared/PageRoutes";

    @Component
    export default class AndroidStart extends Vue {
        name = "AndroidStart";

        @Prop({type: Object as () => CactusMember, required: false, default: null})
        member!: CactusMember|null;

        beforeMount() {
            if (!this.member) {
                this.$router.push(PageRoute.GET_STARTED)
                return;
            }

            this.$router.push(PageRoute.MEMBER_HOME);
        }

    }
</script>

<style scoped lang="scss">

</style>