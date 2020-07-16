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
    import { PageRoute } from '@shared/PageRoutes'
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

        mounted(): void {

        }

        async beforeMount() {
            const embed = !isBlank(getQueryParam(QueryParam.EMBED))
            if (this.$route.path === PageRoute.CORE_VALUES_EMBED || this.$route.path === PageRoute.CORE_VALUES_ASSESSMENT) {
                return;
            }
            if (embed) {
                await pushRoute(PageRoute.CORE_VALUES_EMBED);
                return;
            } else {
                await pushRoute(PageRoute.CORE_VALUES_ASSESSMENT)
                return;
            }
        }
    }
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .coreValuesPage {
        display: flex;
        flex-flow: column nowrap;
        min-height: 100vh;
        justify-content: space-between;
        overflow: hidden;
        position: relative;


        &:after {
            background: url(/assets/images/cvBlob.png) no-repeat;
            content: "";
            display: block;
            height: 35rem;
            overflow: hidden;
            position: absolute;
            left: 70%;
            top: -26rem;
            width: 40rem;
        }

        &:before {
            background: url(/assets/images/pinkVs.svg) no-repeat;
            background-size: cover;
            content: "";
            display: block;
            height: 17rem;
            overflow: hidden;
            position: absolute;
            right: 70%;
            top: 70%;
            width: 18rem;
        }

        @include r(768) {
            background-color: $beige;

            &:after {
                top: -22rem;
                z-index: 0;
            }
        }

        header, .centered {
            width: 100%;
        }

        .centered {
            position: relative;
            z-index: 1;
            flex-grow: 1;
            max-width: 768px;
            padding: 0 2.4rem 6.4rem;
            text-align: left;
        }

        h1 {
            margin: 3.2rem 0 1.6rem;

            @include r(768) {
                margin: 6.4rem 0 1.6rem;
            }
        }

        p {
            margin-bottom: 1.6rem;
            max-width: 64rem;
        }
    }

    h1 {
        display: none;

        @include r(768) {
            display: block;
        }
    }

</style>
