<template>
    <section class="valuesContainer" :class="{bordered}">
        <h2>{{title}}</h2>
        <div class="flexIt">
            <ul class="core-values-list">
                <li v-for="(coreValue, index) in displayValues" :key="`value_${index}`" class="core-value">
                    <h3>{{coreValue.value}}</h3>
                    <p class="description" v-if="showDescription">{{coreValue.description}}</p>
                </li>
            </ul>
            <div class="imgContainer" v-if="coreValuesBlob">
                <img :src="coreValuesBlob.imageUrl" alt="Core Values Graphic"/>
            </div>
        </div>
        <dropdown-menu :items="coreValuesDropdownLinks" class="dotsBtn" v-if="showDropdownMenu"/>
    </section>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import { Prop } from "vue-property-decorator";
    import { CoreValue, CoreValueMeta, CoreValuesService } from "@shared/models/CoreValueTypes";
    import { DropdownMenuLink } from "@components/DropdownMenuTypes";
    import { PageRoute } from "@shared/PageRoutes";
    import { CoreValuesBlob, getCoreValuesBlob } from "@shared/util/CoreValuesUtil";
    import { getQueryParam } from "@web/util";
    import { QueryParam } from "@shared/util/queryParams";
    import Logger from "@shared/Logger"
    import DropdownMenu from "@components/DropdownMenu.vue";

    const logger = new Logger("CoreValueResults");

    @Component({
        components: {
            DropdownMenu,
        }
    })
    export default class CoreValueResults extends Vue {
        name = "CoreValueResults";

        @Prop({ type: Array as () => CoreValue[], required: true, default: [] })
        coreValues!: CoreValue[];

        @Prop({ type: Boolean, default: false })
        showDescription!: boolean;

        @Prop({ type: Boolean, default: true })
        showDropdownMenu!: boolean;

        @Prop({type: Boolean, default: true})
        bordered!: boolean;

        @Prop({type: String|null, default: "Core Values"})
        title!: string|null;

        get displayValues(): CoreValueMeta[] {
            return (this.coreValues ?? []).map(value => CoreValuesService.shared.getMeta(value))
        }

        get coreValuesBlob(): CoreValuesBlob | undefined {
            if (!this.coreValues || this.coreValues.length === 0) {
                return undefined;
            }
            const forceIndex = getQueryParam(QueryParam.BG_INDEX)
            logger.info("Forcing index: ", forceIndex);
            const blob = getCoreValuesBlob(this.coreValues, forceIndex);
            logger.info("Blob info:", blob);
            return blob;
        }

        get coreValuesDropdownLinks(): DropdownMenuLink[] {
            return [{
                title: "Retake Assessment",
                href: PageRoute.CORE_VALUES_ASSESSMENT,
            }];
        }
    }
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";
    @import "insights";

    .centered {
        flex-grow: 1;
        padding: 0 0 6.4rem;
        text-align: left;

        @include r(374) {
            padding: 0 2.4rem 6.4rem;
        }
    }

    .valuesContainer {
        margin: 0 2.4rem 3.2rem;

        @include r(374) {
            margin: 0 0 3.2rem;
        }
        @include r(768) {
            margin: 0 1.6rem 4.8rem 0;
        }
    }

    .valuesContainer {
        &.bordered {
            border: 1px solid $lightest;
        }
        border-radius: 1.6rem;
        padding: 2.4rem;
        position: relative;

        @include r(374) {
            padding: 2.4rem 3.2rem;
        }
        @include r(768) {
            display: flex;
            flex-direction: column;
            margin-bottom: 4.8rem;
        }

        h2 {
            @include r(768) {
                margin-bottom: 3.2rem;
            }
            @include r(960) {
                margin-bottom: 0;
            }
        }

        .flexIt {
            align-items: center;
            display: flex;
            flex-grow: 1;

            @include r(600) {
                justify-content: space-between;
            }
            @include r(768) {
                flex-direction: column;
            }
            @include r(960) {
                flex-direction: row;
            }
        }
    }

    .core-values-list {
        list-style: none;
        margin: 2.4rem 2.4rem .8rem 0;
        padding: 0;

        @include r(768) {
            margin: 0;
            width: 100%;
        }
        @include r(960) {
            margin: 0;
            width: 50%;
        }
    }

    .core-value {
        list-style: none;
        margin: 0 0 .8rem;
        padding: 0;

        @include r(600) {
            margin-bottom: 1.6rem;
        }
    }

    .imgContainer {

        @include r(600) {
            width: 40%;
        }
        @include r(768) {
            width: 100%;
        }
        @include r(960) {
            width: 40%;
        }

        img {
            max-height: 16rem;
            position: relative;

            @include r(600) {
                height: auto;
                max-height: 32rem;
                max-width: 100%;
                width: auto;
            }
        }
    }
</style>