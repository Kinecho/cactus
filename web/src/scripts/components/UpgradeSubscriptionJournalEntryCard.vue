<template>
    <div class="upgrade-wrapper">
        <div class="upgrade-card">
            <p>
                There is no content today because you're on the Basic plan. Please upgrade to get daily prompts
            </p>
            <div class="actions">
                <a :href="upgradeRoute" class="btn button primary">Upgrade</a>
            </div>
        </div>

    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {PageRoute} from "@shared/PageRoutes";

    export default Vue.extend({
        created() {

        },
        props: {},
        data(): {
            upgradeRoute: string
        } {
            return {
                upgradeRoute: PageRoute.PAYMENT_PLANS
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .upgrade-card {
        @include shadowbox;
        padding: 4rem;
        background-color: $beige;

        text-align: center;
        .actions {
            margin-top: 2rem;
        }
    }

    .upgrade-wrapper {
        margin-bottom: 3rem;
    }

</style>

