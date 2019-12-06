<template>
    <div class="page-container">
        <NavBar/>
        <div class="centered">
            <section class="hasApp">
                <h2>Continue on the app</h2>
                <p>Finish logging in to your device</p>
                <div class="actions">
                    <a :href="deepLink" class="button primary" title="Sign In To App">Open Cactus</a>
                </div>
            </section>
            <section class="needsApp" v-if="false">
                <h2>Get the Cactus app</h2>
                <a :href="appStoreUrl" target="_blank" style="display:inline-block;overflow:hidden;background:url(/assets/apple_app_store_badge.svg) no-repeat;width:135px;height:40px;"></a>
            </section>

        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {Config} from '@web/config';
    import {getAllQueryParams} from '@web/util';
    import {appendQueryParams} from '@shared/util/StringUtil';
    import NavBar from "@components/NavBar.vue";

    export default Vue.extend({
        components: {
            NavBar,
        },
        created() {
            console.log("magic link app continue");
        },
        props: {
            link: {type: String, required: true}
        },
        data(): {
            appStoreUrl: string,
        } {
            return {
                appStoreUrl: "https://apps.apple.com/us/app/cactus/id1474513514"
            }
        },
        computed: {
            deepLink(): string {
                const base = `${Config.appCustomScheme}://auth-actions`;
                let params = getAllQueryParams(self.link);
                return appendQueryParams(base, params);
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .page-container {
        min-height: 100vh;

        .centered {
            flex-grow: 1;
            max-width: 70rem;
            padding: 6.4rem 2.4rem;

            section {
                margin-bottom: 4rem;

                p {
                    opacity: .8;
                }

                &.hasApp {
                    padding: 4rem;
                    @include shadowbox;
                    color: $white;
                    background: $darkestGreen url(/assets/images/darkGreenNeedles.svg) 0 0/320px;

                }

                .actions {
                    padding: 4rem 0;
                }
            }

        }
    }


</style>
