<template>
    <div class="coreValuesPage">
        <div class="centered">
            <router-view :member="this.member"/>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import CactusMember from '@shared/models/CactusMember'
    import { NamedRoute, PageRoute } from '@shared/PageRoutes'
    import { isBlank } from "@shared/util/StringUtil";
    import Logger from "@shared/Logger";
    import { getQueryParam } from "@web/util";
    import { QueryParam } from "@shared/util/queryParams";
    import { pushRoute } from "@web/NavigationUtil";
    import Component from "vue-class-component";
    import { Prop } from "vue-property-decorator";

    const logger = new Logger("CoreValuesPage");

    @Component
    export default class CoreValuesPage extends Vue {

        @Prop({ type: Object as () => CactusMember, required: false, default: null })
        member!: CactusMember | null;

        async beforeMount() {
            const embed = !isBlank(getQueryParam(QueryParam.EMBED))
            if (this.$route.path === PageRoute.CORE_VALUES_EMBED || this.$route.path === PageRoute.CORE_VALUES_ASSESSMENT) {
                return;
            }
            if (embed) {
                await pushRoute(PageRoute.CORE_VALUES_EMBED);
                return;
            } else if (this.$route.path === PageRoute.CORE_VALUES) {
                await pushRoute({ name: NamedRoute.CORE_VALUES_NEW })
            } else {
                return;
            }
        }
    }
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";
    @import "assessment";


</style>
