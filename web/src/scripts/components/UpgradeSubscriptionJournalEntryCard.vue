<template>
    <div class="upgradeJournal basic">
        <div class="centered">
            <p>Get daily insights, core values, and more.</p>
            <a :href="upgradeRoute" class="button primary small">Try Cactus Plus</a>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {PageRoute} from "@shared/PageRoutes";
    import CactusMember from '@shared/models/CactusMember';
    import CopyService from "@shared/copy/CopyService";

    const copy = CopyService.getSharedInstance().copy
    export default Vue.extend({
        created() {

        },
        props: {
            member: {type: CactusMember},
        },
        data(): {
            upgradeRoute: string
        } {
            return {
                upgradeRoute: PageRoute.PRICING
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .upgradeJournal {
        color: $white;
        padding: 1.6rem 2.4rem;

        .centered {
            max-width: 58rem;
            text-align: left;
        }

        &.upgrade {
            background: $royal url(/assets/images/plusBg.svg) center top/140vw auto no-repeat;

            @include r(960) {
                background-size: 97% auto;
            }

            p {
                font-size: 1.8rem;
            }
        }

        &.basic {
            background: $royal url(/assets/images/plusBg.svg) center top/130% auto no-repeat;
            width: 100%;

            @include r(960) {
                background-size: 90% auto;
                padding: .8rem;
                text-align: center;

                .centered {
                    max-width: none;
                    text-align: center;
                }

                h3, p {
                    display: inline;
                    font-size: 1.8rem;
                    margin-right: 1.6rem;
                }

                a.button {
                    margin-bottom: 0;
                }
            }
        }

        h3 {
            font-size: 2rem;
            margin-bottom: .4rem;
        }

        p {
            font-size: 1.6rem;
            margin-bottom: 1.6rem;
        }

        a.button {
            display: inline-block;
            margin-bottom: .8rem;
        }
    }

</style>
