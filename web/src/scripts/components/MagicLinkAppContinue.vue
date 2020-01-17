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
            <section class="needsApp" v-if="true">
                <h4>Need to install Cactus?</h4>
                <AppStoreIcon />
                <PlayStoreIcon />
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
    import AppStoreIcon from "@components/AppStoreIcon.vue";
    import PlayStoreIcon from "@components/PlayStoreIcon.vue";
    import Logger from "@shared/Logger";

    const logger = new Logger("MagicLinkAppContinue.vue");
    export default Vue.extend({
        components: {
            NavBar,
            AppStoreIcon,
            PlayStoreIcon
        },
        created() {
            logger.log("magic link app continue");
        },
        props: {
            link: {type: String, required: true}
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
            .app-store-icon {
                margin-top: 1rem;
            }

        }
    }


</style>
