<template>
    <section class="valuesContainer" :class="{withDescription: showDescription}">
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
    import { Prop, Watch } from "vue-property-decorator";
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

        @Prop({ type: String as () => string | null, default: "Core Values" })
        title!: string | null;

        displayValues: CoreValueMeta[] = [];
        coreValuesBlob: CoreValuesBlob | null = null;

        @Watch("coreValues")
        onCoreValues(updated: CoreValue[]) {
            this.coreValuesBlob = getCoreValuesBlob(updated) ?? null;
            this.displayValues = (this.coreValues ?? []).map(value => CoreValuesService.shared.getMeta(value))
        }


        beforeMount() {
            this.onCoreValues(this.coreValues);
        }

        // get displayValues(): CoreValueMeta[] {
        //     return (this.coreValues ?? []).map(value => CoreValuesService.shared.getMeta(value))
        // }

        // get coreValuesBlob(): CoreValuesBlob | null {
        //     if (!this.coreValues || this.coreValues.length === 0) {
        //         return null;
        //     }
        //     // const forceIndex = getQueryParam(QueryParam.BG_INDEX)
        //     // logger.info("Forcing index: ", forceIndex);
        //     const blob = getCoreValuesBlob(this.coreValues);
        //     // logger.info("Blob info:", blob);
        //     return blob ?? null;
        // }

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

    .valuesContainer {
        border-radius: 1.6rem;
        padding: 2.4rem;
        position: relative;
        text-align: left;

        @include r(374) {
            padding: 2.4rem 3.2rem;
        }
        @include r(768) {
            display: flex;
            flex-direction: column;
            width: 100%;
        }

        h2 {
            @include r(768) {
                margin-bottom: 3.2rem;
            }
        }
    }

    .flexIt {
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

        .withDescription & {
            flex-direction: column;

            @include r(600) {
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

        .withDescription & {
            margin-right: 0;

            @include r(600) {
                width: 50%;
            }
            @include r(768) {
                margin-right: 2.4rem;
                width: auto;
            }
        }
    }

    .core-value {
        list-style: none;
        margin: 0 0 .8rem;
        padding: 0;

        @include r(600) {
            margin-bottom: 1.6rem;
        }

        .withDescription & {
            background-color: $white;
            margin-bottom: 1.6rem;
        }
    }

    .description {
        font-size: 1.6rem;
        opacity: .8;

        @include r(600) {
            font-size: 1.8rem;
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

        .withDescription & {
            position: absolute;
            right: -4.8rem;
            top: -4.8rem;

            @include r(600) {
                position: static;
            }
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